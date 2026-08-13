const request = require('supertest');
const { buildApp } = require('../app');

describe('Backend smoke tests', () => {
  const app = buildApp();

  it('GET /health returns 200', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('GET /api/health returns 200', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('GET /api/auth/me requires authentication', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
