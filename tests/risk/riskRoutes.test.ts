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

jest.mock('../../src/services/riskService', () => ({
  evaluateRisk: jest.fn(async () => ({
    id: 'risk-1',
    organizationId: 'org-1',
    userId: 'user-1',
    riskScore: 42,
    riskLevel: 'MODERATE',
    ruleHits: ['geo_mismatch'],
  })),
}));

const app = require('../../src/app').default;
const token = jwt.sign({ sub: 'user-1', org_id: 'org-1', cnf: { jkt: 'demo-thumb' } }, 'demo-secret');

describe('Risk routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('computes risk score with valid payload', async () => {
    const response = await request(app)
      .post('/v1/risk/score')
      .set('Authorization', `Bearer ${token}`)
      .set('dpop', 'stubbed')
      .set('x-org-id', 'org-1')
      .send({
        userId: 'user-1',
        geoMismatch: true,
        simahDelinquencyCount: 1,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('riskScore', 42);
  });

  it('returns validation error for malformed request', async () => {
    const response = await request(app)
      .post('/v1/risk/score')
      .set('Authorization', `Bearer ${token}`)
      .set('dpop', 'stubbed')
      .set('x-org-id', 'org-1')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: 'ValidationError' });
  });
});
