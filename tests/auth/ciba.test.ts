import request from 'supertest';

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

const app = require('../../src/app').default;

describe('CIBA endpoints', () => {
  it('returns auth_req_id for initiation', async () => {
    const response = await request(app)
      .post('/ciba/auth/request')
      .set('x-nonce', Date.now().toString())
      .send({ client_id: 'demo', login_hint: 'user-123', scope: 'accounts.read' });

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty('auth_req_id');
  });

  it('responds with authorization_pending when not approved', async () => {
    const requestResponse = await request(app)
      .post('/ciba/auth/request')
      .set('x-nonce', `${Date.now()}-pending`)
      .send({ client_id: 'demo', login_hint: 'user-456', scope: 'accounts.read' });

    const pollResponse = await request(app)
      .post('/ciba/auth/token')
      .send({ auth_req_id: requestResponse.body.auth_req_id });

    expect(pollResponse.status).toBe(400);
    expect(pollResponse.body.error).toBe('authorization_pending');
  });
});
