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

const riskAssessment = { id: 'risk-1', riskScore: 40 };
const creditCheck = { id: 'credit-1', simahScore: 720, exposureSar: '5000' };

jest.mock('../../src/config/prisma', () => ({
  __esModule: true,
  default: {
    riskAssessment: {
      findUnique: jest.fn(async () => null),
      findFirst: jest.fn(async () => riskAssessment),
    },
    creditCheck: {
      findUnique: jest.fn(async () => null),
      findFirst: jest.fn(async () => creditCheck),
    },
  },
}));

jest.mock('../../src/services/autoApprovalService', () => ({
  evaluateAutoApproval: jest.fn(async () => ({
    id: 'decision-1',
    status: 'APPROVED',
    organizationId: 'org-1',
    userId: 'user-1',
    riskScore: 40,
    creditScore: 720,
  })),
}));

const app = require('../../src/app').default;
const token = jwt.sign({ sub: 'user-1', org_id: 'org-1', cnf: { jkt: 'demo-thumb' } }, 'demo-secret');

describe('Approval routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('produces an automated decision for valid input', async () => {
    const response = await request(app)
      .post('/v1/approval/decide')
      .set('Authorization', `Bearer ${token}`)
      .set('dpop', 'stubbed')
      .set('x-org-id', 'org-1')
      .send({ userId: 'user-1', amountSar: 250.5 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'APPROVED');
  });

  it('returns validation errors for malformed requests', async () => {
    const response = await request(app)
      .post('/v1/approval/decide')
      .set('Authorization', `Bearer ${token}`)
      .set('dpop', 'stubbed')
      .set('x-org-id', 'org-1')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: 'ValidationError' });
  });
});
