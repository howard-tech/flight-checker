const { api } = require('./setup');

describe('MCP Tools API', () => {
  
  describe('POST /api/mcp/search_flight', () => {
    
    test('should return flight details for VN123', async () => {
      const res = await api.post('/api/mcp/search_flight', {
        flight_code: 'VN123'
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('result');
      expect(res.body.result).toHaveProperty('flight_code', 'VN123');
      expect(res.body.result).toHaveProperty('status', 'On Time');
    });

    test('should return delay info for VN456', async () => {
      const res = await api.post('/api/mcp/search_flight', {
        flight_code: 'VN456'
      });

      expect(res.status).toBe(200);
      expect(res.body.result.status).toBe('Delayed');
      expect(res.body.result.delay_minutes).toBeGreaterThan(0);
      expect(res.body.result.delay_reason).toBeDefined();
    });

    test('should return cancelled status for QH101', async () => {
      const res = await api.post('/api/mcp/search_flight', {
        flight_code: 'QH101'
      });

      expect(res.status).toBe(200);
      expect(res.body.result.status).toBe('Cancelled');
    });

    test('should return 404 for invalid flight code', async () => {
      const res = await api.post('/api/mcp/search_flight', {
        flight_code: 'INVALID999'
      });

      expect(res.status).toBe(404);
    });

    test('should return error for missing flight_code', async () => {
      const res = await api.post('/api/mcp/search_flight', {});

      expect(res.status).toBe(400);
    });

    test('should handle lowercase flight code', async () => {
      const res = await api.post('/api/mcp/search_flight', {
        flight_code: 'vn123'
      });

      // Should either work (case insensitive) or return 404
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('POST /api/mcp/get_weather', () => {
    
    test('should return weather for SGN', async () => {
      const res = await api.post('/api/mcp/get_weather', {
        airport_code: 'SGN'
      });

      expect(res.status).toBe(200);
      expect(res.body.result).toHaveProperty('temperature');
      expect(res.body.result).toHaveProperty('condition');
      expect(res.body.result).toHaveProperty('humidity');
    });

    test('should return weather for HAN', async () => {
      const res = await api.post('/api/mcp/get_weather', {
        airport_code: 'HAN'
      });

      expect(res.status).toBe(200);
      expect(res.body.result.temperature).toBeGreaterThan(0);
      expect(res.body.result.temperature).toBeLessThan(50);
    });

    test('temperature should be reasonable range', async () => {
      const res = await api.post('/api/mcp/get_weather', {
        airport_code: 'SGN'
      });

      expect(res.body.result.temperature).toBeGreaterThanOrEqual(15);
      expect(res.body.result.temperature).toBeLessThanOrEqual(45);
    });

    test('humidity should be 0-100', async () => {
      const res = await api.post('/api/mcp/get_weather', {
        airport_code: 'SGN'
      });

      expect(res.body.result.humidity).toBeGreaterThanOrEqual(0);
      expect(res.body.result.humidity).toBeLessThanOrEqual(100);
    });

    test('should return 404 for invalid airport', async () => {
      const res = await api.post('/api/mcp/get_weather', {
        airport_code: 'XXX'
      });

      expect(res.status).toBe(404);
    });

    test('should return error for missing airport_code', async () => {
      const res = await api.post('/api/mcp/get_weather', {});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/mcp/find_alternatives', () => {
    
    test('should find alternatives for SGN to HAN', async () => {
      const res = await api.post('/api/mcp/find_alternatives', {
        from_airport: 'SGN',
        to_airport: 'HAN'
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('result');
      expect(Array.isArray(res.body.result)).toBe(true);
    });

    test('alternative flights should have required fields', async () => {
      const res = await api.post('/api/mcp/find_alternatives', {
        from_airport: 'SGN',
        to_airport: 'HAN'
      });

      if (res.body.result.length > 0) {
        const flight = res.body.result[0];
        expect(flight).toHaveProperty('flight_code');
        expect(flight).toHaveProperty('departure_time');
      }
    });

    test('should return error for missing parameters', async () => {
      const res = await api.post('/api/mcp/find_alternatives', {
        from_airport: 'SGN'
      });

      expect(res.status).toBe(400);
    });

    test('should handle same origin and destination', async () => {
      const res = await api.post('/api/mcp/find_alternatives', {
        from_airport: 'SGN',
        to_airport: 'SGN'
      });

      // Should return empty array or error
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.result.length).toBe(0);
      }
    });
  });

  describe('POST /api/mcp/calculate_compensation', () => {
    
    test('should calculate compensation for 3+ hour delay', async () => {
      const res = await api.post('/api/mcp/calculate_compensation', {
        delay_minutes: 180,
        ticket_price: 2000000
      });

      expect(res.status).toBe(200);
      expect(res.body.result.eligible).toBe(true);
      expect(res.body.result.compensation_amount).toBeGreaterThan(0);
    });

    test('should return no compensation for short delay', async () => {
      const res = await api.post('/api/mcp/calculate_compensation', {
        delay_minutes: 60,
        ticket_price: 2000000
      });

      expect(res.status).toBe(200);
      expect(res.body.result.eligible).toBe(false);
    });

    test('should calculate compensation for 2-3 hour delay', async () => {
      const res = await api.post('/api/mcp/calculate_compensation', {
        delay_minutes: 150,
        ticket_price: 2000000
      });

      expect(res.status).toBe(200);
      // May or may not be eligible depending on business rules
      expect(typeof res.body.result.eligible).toBe('boolean');
    });

    test('compensation should be proportional to ticket price', async () => {
      const res1 = await api.post('/api/mcp/calculate_compensation', {
        delay_minutes: 180,
        ticket_price: 1000000
      });

      const res2 = await api.post('/api/mcp/calculate_compensation', {
        delay_minutes: 180,
        ticket_price: 2000000
      });

      if (res1.body.result.eligible && res2.body.result.eligible) {
        // Higher ticket price should result in higher or equal compensation
        expect(res2.body.result.compensation_amount)
          .toBeGreaterThanOrEqual(res1.body.result.compensation_amount);
      }
    });

    test('should return error for negative delay', async () => {
      const res = await api.post('/api/mcp/calculate_compensation', {
        delay_minutes: -10,
        ticket_price: 2000000
      });

      expect(res.status).toBe(400);
    });

    test('should return error for zero ticket price', async () => {
      const res = await api.post('/api/mcp/calculate_compensation', {
        delay_minutes: 180,
        ticket_price: 0
      });

      expect(res.status).toBe(400);
    });

    test('should return error for missing parameters', async () => {
      const res = await api.post('/api/mcp/calculate_compensation', {
        delay_minutes: 180
      });

      expect(res.status).toBe(400);
    });
  });
});
