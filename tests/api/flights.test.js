const { api } = require('./setup');

describe('Flights API', () => {
  
  describe('GET /api/flights', () => {
    
    test('should return list of flights', async () => {
      const res = await api.get('/api/flights');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('should return at least one flight', async () => {
      const res = await api.get('/api/flights');
      
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('each flight should have required fields', async () => {
      const res = await api.get('/api/flights');
      const flight = res.body[0];
      
      expect(flight).toHaveProperty('flight_code');
      expect(flight).toHaveProperty('airline');
      expect(flight).toHaveProperty('from_airport');
      expect(flight).toHaveProperty('to_airport');
      expect(flight).toHaveProperty('status');
    });

    test('flight_code should be string with correct format', async () => {
      const res = await api.get('/api/flights');
      
      res.body.forEach(flight => {
        expect(typeof flight.flight_code).toBe('string');
        expect(flight.flight_code).toMatch(/^[A-Z]{2}\d{3,4}$/);
      });
    });

    test('status should be valid enum value', async () => {
      const validStatuses = ['On Time', 'Delayed', 'Cancelled', 'Boarding', 'Departed', 'Landed'];
      const res = await api.get('/api/flights');
      
      res.body.forEach(flight => {
        expect(validStatuses).toContain(flight.status);
      });
    });
  });

  describe('Flight Status Verification', () => {
    
    test('VN123 should be On Time', async () => {
      const res = await api.get('/api/flights');
      const vn123 = res.body.find(f => f.flight_code === 'VN123');
      
      expect(vn123).toBeDefined();
      expect(vn123.status).toBe('On Time');
      expect(vn123.airline).toBe('Vietnam Airlines');
    });

    test('VN456 should be Delayed with delay info', async () => {
      const res = await api.get('/api/flights');
      const vn456 = res.body.find(f => f.flight_code === 'VN456');
      
      expect(vn456).toBeDefined();
      expect(vn456.status).toBe('Delayed');
      expect(vn456.delay_minutes).toBeGreaterThan(0);
      expect(vn456.delay_reason).toBeDefined();
    });

    test('QH101 should be Cancelled', async () => {
      const res = await api.get('/api/flights');
      const qh101 = res.body.find(f => f.flight_code === 'QH101');
      
      expect(qh101).toBeDefined();
      expect(qh101.status).toBe('Cancelled');
    });
  });

  describe('Airport Code Validation', () => {
    
    test('airport codes should be 3 letters', async () => {
      const res = await api.get('/api/flights');
      
      res.body.forEach(flight => {
        expect(flight.from_airport).toMatch(/^[A-Z]{3}$/);
        expect(flight.to_airport).toMatch(/^[A-Z]{3}$/);
      });
    });

    test('should have flights from SGN', async () => {
      const res = await api.get('/api/flights');
      const sgnFlights = res.body.filter(f => f.from_airport === 'SGN');
      
      expect(sgnFlights.length).toBeGreaterThan(0);
    });
  });
});
