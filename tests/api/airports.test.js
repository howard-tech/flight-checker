const { api } = require('./setup');

describe('Airports API', () => {
  
  describe('GET /api/airports', () => {
    
    test('should return list of airports', async () => {
      const res = await api.get('/api/airports');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('should return at least 4 airports', async () => {
      const res = await api.get('/api/airports');
      
      expect(res.body.length).toBeGreaterThanOrEqual(4);
    });

    test('each airport should have required fields', async () => {
      const res = await api.get('/api/airports');
      const airport = res.body[0];
      
      expect(airport).toHaveProperty('airport_code');
      expect(airport).toHaveProperty('name');
      expect(airport).toHaveProperty('city');
    });

    test('airport_code should be 3 uppercase letters', async () => {
      const res = await api.get('/api/airports');
      
      res.body.forEach(airport => {
        expect(airport.airport_code).toMatch(/^[A-Z]{3}$/);
      });
    });

    test('should include SGN, HAN, DAD, PQC', async () => {
      const res = await api.get('/api/airports');
      const codes = res.body.map(a => a.airport_code);
      
      expect(codes).toContain('SGN');
      expect(codes).toContain('HAN');
      expect(codes).toContain('DAD');
      expect(codes).toContain('PQC');
    });

    test('SGN should be Tan Son Nhat', async () => {
      const res = await api.get('/api/airports');
      const sgn = res.body.find(a => a.airport_code === 'SGN');
      
      expect(sgn).toBeDefined();
      expect(sgn.name).toMatch(/tan son nhat/i);
      expect(sgn.city).toMatch(/ho chi minh/i);
    });

    test('airports should have lounges array', async () => {
      const res = await api.get('/api/airports');
      
      res.body.forEach(airport => {
        if (airport.lounges) {
          expect(Array.isArray(airport.lounges)).toBe(true);
        }
      });
    });
  });
});
