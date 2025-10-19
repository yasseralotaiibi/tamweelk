import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../../src/config/redis', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      status: 'ready',
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
      quit: jest.fn(async () => undefined),
    },
    ensureRedisConnection: jest.fn(async () => undefined),
  };
});

const consentRecord = {
  id: 'consent-1',
  organizationId: 'org-1',
  userId: 'user-1',
  provider: 'demo-bank',
  scopes: ['accounts.read'],
  status: 'ACTIVE',
  expiresAt: new Date().toISOString(),
  revokedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

jest.mock('../../src/config/prisma', () => ({
  __esModule: true,
  default: {
    consent: {
      create: jest.fn(async () => consentRecord),
      findMany: jest.fn(async () => [consentRecord]),
      update: jest.fn(async () => ({ ...consentRecord, status: 'REVOKED', revokedAt: new Date().toISOString() })),
    },
    resource: {
      create: jest.fn(async () => ({ id: 'resource-1' })),
    },
    relation: {
      createMany: jest.fn(async () => ({ count: 1 })),
    },
  },
}));

jest.mock('../../src/utils/pdpl', () => ({
  __esModule: true,
  assertDataMinimisation: jest.fn(),
  issueConsentReceipt: jest.fn(),
  appendAuditTrail: jest.fn(),
}));

jest.mock('../../src/middleware/dpop', () => ({
  dpopValidationMiddleware: jest.fn((_req: any, _res: any, next: () => void) => {
    _req.dpop = { thumbprint: 'demo-thumb', jti: 'demo-jti' };
    next();
  }),
}));

jest.mock('../../src/middleware/orgResolver', () => ({
  orgResolverMiddleware: jest.fn((req: any, _res: any, next: () => void) => {
    req.organization = { id: 'org-1', slug: 'riyada', riskThreshold: 70, defaultAcr: 'loa3' };
    req.subjectRoles = ['tpp_admin'];
    next();
  }),
}));

jest.mock('../../src/services/fgaService', () => ({
  checkAccess: jest.fn(async () => true),
}));

const app = require('../../src/app').default;

const token = jwt.sign({ sub: 'user-1', org_id: 'org-1', cnf: { jkt: 'demo-thumb' } }, 'demo-secret');

describe('Consent endpoints', () => {
  it('creates a consent record', async () => {
    const response = await request(app)
      .post('/v1/consents')
      .set('Authorization', `Bearer ${token}`)
      .set('x-nonce', `${Date.now()}-consent`)
      .set('dpop', 'mocked')
      .set('x-org-id', 'org-1')
      .send({ userId: 'user-1', scopes: ['accounts.read'] });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 'consent-1');
  });

  it('lists consents filtered by FGA', async () => {
    const response = await request(app)
      .get('/v1/consents')
      .set('Authorization', `Bearer ${token}`)
      .set('dpop', 'mocked')
      .set('x-org-id', 'org-1');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].id).toBe('consent-1');
  });
});
