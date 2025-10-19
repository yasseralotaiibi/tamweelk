import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../../src/middleware/dpop', () => ({
  dpopValidationMiddleware: jest.fn((req: any, _res: any, next: () => void) => {
    req.dpop = { thumbprint: 'demo-thumb', jti: 'demo-jti' };
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

const userRecord = { id: 'user-1' };

jest.mock('../../src/config/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(async ({ where }: any) => (where.id === userRecord.id ? userRecord : null)),
    },
    organization: {
      findUnique: jest.fn(async ({ where }: any) =>
        where.slug === 'riyada' ? { id: 'org-1', slug: 'riyada' } : null
      ),
    },
  },
}));

const kycRecord = {
  id: 'kyc-1',
  organizationId: 'org-1',
  userId: 'user-1',
  providerReference: 'ref-123',
  status: 'PENDING',
};

jest.mock('../../src/services/kycService', () => ({
  submitKyc: jest.fn(async () => kycRecord),
  refreshKycStatus: jest.fn(async () => ({ ...kycRecord, status: 'VERIFIED' })),
  upsertWebhookKyc: jest.fn(async () => ({ ...kycRecord, status: 'VERIFIED' })),
}));

const app = require('../../src/app').default;

const token = jwt.sign({ sub: 'user-1', org_id: 'org-1', cnf: { jkt: 'demo-thumb' } }, 'demo-secret');

describe('KYC routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts a valid KYC submission', async () => {
    const response = await request(app)
      .post('/v1/kyc/submit')
      .set('Authorization', `Bearer ${token}`)
      .set('dpop', 'stubbed')
      .set('x-org-id', 'org-1')
      .send({
        userId: 'user-1',
        nationalId: '1029384756',
        documentNumber: 'A1234567',
        documentType: 'national_id',
        firstName: 'Riyada',
        lastName: 'User',
      });

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty('id', 'kyc-1');
  });

  it('rejects invalid submissions with validation errors', async () => {
    const response = await request(app)
      .post('/v1/kyc/submit')
      .set('Authorization', `Bearer ${token}`)
      .set('dpop', 'stubbed')
      .set('x-org-id', 'org-1')
      .send({ nationalId: '123' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: 'ValidationError' });
    expect(Array.isArray(response.body.details)).toBe(true);
  });

  it('processes provider webhooks', async () => {
    const response = await request(app)
      .post('/v1/kyc/webhook')
      .send({
        organizationSlug: 'riyada',
        reference: 'ref-123',
        status: 'VERIFIED',
        pepFlag: false,
        sanctionsFlag: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'VERIFIED');
  });
});
