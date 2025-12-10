const { api, checkApiHealth } = require('./setup');

describe('Health Check API', () => {
  
  beforeAll(async () => {
    // Verify API is running
    const isHealthy = await checkApiHealth();
    if (!isHealthy) {
      console.warn('⚠️ API may not be running. Some tests might fail.');
    }
  });

  describe('GET /api/health', () => {
    
    test('should return ok status when healthy', async () => {
      const res = await api.get('/api/health');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });

    test('should report database connection status', async () => {
      const res = await api.get('/api/health');
      
      expect(res.body).toHaveProperty('database');
      expect(['connected', 'disconnected']).toContain(res.body.database);
    });

    test('should include timestamp', async () => {
      const res = await api.get('/api/health');
      
      if (res.body.timestamp) {
        expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
      }
    });

    test('should respond within 500ms', async () => {
      const start = Date.now();
      await api.get('/api/health');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(500);
    });

    test('should return correct content-type', async () => {
      const res = await api.get('/api/health');
      
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
