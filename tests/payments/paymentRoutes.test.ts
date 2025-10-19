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

jest.mock('../../src/middleware/fga', () => ({
  fgaMiddleware: jest.fn(() => (_req: any, _res: any, next: () => void) => next()),
}));

jest.mock('../../src/config/prisma', () => ({
  __esModule: true,
  default: {
    consent: {
      findFirst: jest.fn(async ({ where }: any) =>
        where.id === 'consent-1' ? { id: 'consent-1', organizationId: 'org-1' } : null
      ),
    },
    riskAssessment: {
      findFirst: jest.fn(async () => ({ id: 'risk-1', riskScore: 45 })),
    },
  },
}));

jest.mock('../../src/services/paymentService', () => ({
  initiatePayment: jest.fn(async () => ({
    id: 'payment-1',
    status: 'INITIATED',
    amount: '100.00',
    currency: 'SAR',
  })),
}));

const app = require('../../src/app').default;
const token = jwt.sign({ sub: 'user-1', org_id: 'org-1', cnf: { jkt: 'demo-thumb' } }, 'demo-secret');

describe('Payment routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initiates a payment when payload is valid', async () => {
    const response = await request(app)
      .post('/v1/payments/consent-1/initiate')
      .set('Authorization', `Bearer ${token}`)
      .set('dpop', 'stubbed')
      .set('x-org-id', 'org-1')
      .set('x-risk-score', '40')
      .send({ userId: 'user-1', amount: 100, currency: 'sar' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 'payment-1');
  });

  it('rejects invalid payment payloads', async () => {
    const response = await request(app)
      .post('/v1/payments/consent-1/initiate')
      .set('Authorization', `Bearer ${token}`)
      .set('dpop', 'stubbed')
      .set('x-org-id', 'org-1')
      .send({ userId: 'user-1', amount: -10, currency: 'sa' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: 'ValidationError' });
  });
});
