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

jest.mock('../../src/services/creditService', () => ({
  performCreditCheck: jest.fn(async () => ({
    id: 'credit-1',
    organizationId: 'org-1',
    userId: 'user-1',
    simahScore: 750,
    delinquencyCount: 0,
    exposureSar: '15000',
  })),
}));

const app = require('../../src/app').default;
const token = jwt.sign({ sub: 'user-1', org_id: 'org-1', cnf: { jkt: 'demo-thumb' } }, 'demo-secret');

describe('Credit routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('performs a credit check for a valid request', async () => {
    const response = await request(app)
      .post('/v1/credit/check')
      .set('Authorization', `Bearer ${token}`)
      .set('dpop', 'stubbed')
      .set('x-org-id', 'org-1')
      .send({ userId: 'user-1', nationalId: '1029384756', purpose: 'loan_underwriting' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('simahScore', 750);
  });

  it('returns validation errors when payload missing fields', async () => {
    const response = await request(app)
      .post('/v1/credit/check')
      .set('Authorization', `Bearer ${token}`)
      .set('dpop', 'stubbed')
      .set('x-org-id', 'org-1')
      .send({ userId: '' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: 'ValidationError' });
  });
});
