const { api } = require('./setup');
const { resetTestDatabase, closePool } = require('../utils/db-setup');


describe('MCP Tools API', () => {
  beforeAll(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await closePool();
  });

  describe('POST /api/mcp/search_flight', () => {
    test('returns flight details', async () => {
      const res = await api.post('/api/mcp/search_flight', {
        flight_code: 'VN123'
      });

      expect(res.status).toBe(200);
      expect(res.body.tool).toBe('search_flight');
      expect(res.body.result.flight_code).toBe('VN123');
    });

    test('returns delayed flight info', async () => {
      const res = await api.post('/api/mcp/search_flight', {
        flight_code: 'VN456'
      });

      expect(res.body.result.status).toBe('Delayed');
      expect(res.body.result.delay_minutes).toBe(45);
    });
  });

  describe('POST /api/mcp/get_weather', () => {
    test('returns weather for airport', async () => {
      const res = await api.post('/api/mcp/get_weather', {
        airport_code: 'SGN'
      });

      expect(res.status).toBe(200);
      expect(res.body.result.temperature).toBe(32);
      expect(res.body.result.condition).toBe('Sunny');
    });
  });

  describe('POST /api/mcp/calculate_compensation', () => {
    test('calculates compensation for long delay', async () => {
      const res = await api.post('/api/mcp/calculate_compensation', {
        delay_minutes: 180,
        ticket_price: 2000000
      });

      expect(res.status).toBe(200);
      expect(res.body.result.eligible).toBe(true);
      expect(res.body.result.compensation_amount).toBeGreaterThan(0);
    });

    test('no compensation for short delay', async () => {
      const res = await api.post('/api/mcp/calculate_compensation', {
        delay_minutes: 30,
        ticket_price: 2000000
      });

      expect(res.body.result.eligible).toBe(false);
    });
  });

  describe('POST /api/mcp/find_alternatives', () => {
    test('returns alternative flights', async () => {
      const res = await api.post('/api/mcp/find_alternatives', {
        from_airport: 'SGN',
        to_airport: 'HAN'
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.result.alternatives)).toBe(true);
    });
  });
});
