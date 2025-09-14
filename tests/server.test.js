const request = require('supertest');
const app = require('../src/server');

describe('Server', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      const res = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('memory');
      expect(res.body).toHaveProperty('cpu');
    });
  });

  describe('GET /metrics', () => {
    it('should return performance metrics', async () => {
      const res = await request(app)
        .get('/metrics')
        .expect(200);

      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('requestCount');
      expect(res.body).toHaveProperty('apiCalls');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });
});
