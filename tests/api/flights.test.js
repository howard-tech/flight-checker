const { api } = require('./setup');
const { resetTestDatabase, closePool } = require('../utils/db-setup');


describe('Flights API', () => {
  beforeAll(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await closePool();
  });

  describe('GET /api/flights', () => {
    test('returns list of flights', async () => {
      const res = await api.get('/api/flights');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('each flight has required fields', async () => {
      const res = await api.get('/api/flights');
      const requiredFields = ['flight_code', 'airline', 'from_airport', 'to_airport', 'status'];

      res.body.forEach(flight => {
        requiredFields.forEach(field => {
          expect(flight).toHaveProperty(field);
        });
      });
    });
  });

  describe('GET /api/flights/:code', () => {
    test('returns flight VN123 (On Time)', async () => {
      const res = await api.get('/api/flights/VN123');

      expect(res.status).toBe(200);
      expect(res.body.flight_code).toBe('VN123');
      expect(res.body.status).toBe('On Time');
    });

    test('returns flight VN456 (Delayed)', async () => {
      const res = await api.get('/api/flights/VN456');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('Delayed');
      expect(res.body.delay_minutes).toBe(45);
    });

    test('returns 404 for invalid flight', async () => {
      const res = await api.get('/api/flights/INVALID999');
      expect(res.status).toBe(404);
    });
  });
});
