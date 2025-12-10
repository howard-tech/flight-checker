const { api } = require('./setup');

describe('Health API', () => {
  test('GET /api/health returns ok status', async () => {
    const res = await api.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  test('response time is under 500ms', async () => {
    const start = Date.now();
    await api.get('/api/health');
    expect(Date.now() - start).toBeLessThan(500);
  });
});
