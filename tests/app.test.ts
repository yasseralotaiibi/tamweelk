import request from 'supertest';
import app from '../src/app';

describe('App bootstrap', () => {
  it('responds to health checks', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
