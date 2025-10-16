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

jest.mock('../../src/config/prisma', () => ({
  __esModule: true,
  default: {
    consent: {
      create: jest.fn(async ({ data }) => ({
        id: 'consent-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        revokedAt: null,
        status: 'ACTIVE',
        ...data,
      })),
      findMany: jest.fn(async () => []),
      update: jest.fn(async ({ where }) => ({
        id: where.id,
        customerId: 'demo',
        provider: 'demo-bank',
        scopes: ['accounts.read'],
        status: 'REVOKED',
        expiresAt: new Date().toISOString(),
        revokedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    },
  },
}));

jest.mock('../../src/utils/pdpl', () => ({
  __esModule: true,
  assertDataMinimisation: jest.fn(),
  issueConsentReceipt: jest.fn(),
  appendAuditTrail: jest.fn(),
}));

const app = require('../../src/app').default;

const token = jwt.sign({ sub: 'demo-user' }, 'demo-secret');

describe('Consent endpoints', () => {
  it('creates a consent record', async () => {
    const response = await request(app)
      .post('/consents')
      .set('Authorization', `Bearer ${token}`)
      .set('x-nonce', `${Date.now()}-consent`)
      .send({ customerId: 'demo-user', scopes: ['accounts.read'] });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 'consent-1');
  });

  it('lists consents', async () => {
    const response = await request(app).get('/consents').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
