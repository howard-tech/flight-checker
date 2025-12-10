const { Pool } = require('pg');
require('dotenv').config({ path: '.env.test' });

describe('Database Integration Tests', () => {
  let pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  describe('Connection', () => {
    
    test('should connect to database', async () => {
      const result = await pool.query('SELECT NOW()');
      expect(result.rows).toHaveLength(1);
    });

    test('should handle concurrent connections', async () => {
      const queries = Array(5).fill().map(() => pool.query('SELECT 1'));
      const results = await Promise.all(queries);
      
      results.forEach(result => {
        expect(result.rows).toHaveLength(1);
      });
    });
  });

  describe('Flights Table', () => {
    
    test('flights table should exist', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'flights'
        )
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have flight data', async () => {
      const result = await pool.query('SELECT COUNT(*) FROM flights');
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });

    test('should query flight by code', async () => {
      const result = await pool.query(
        'SELECT * FROM flights WHERE flight_code = $1',
        ['VN123']
      );
      
      if (result.rows.length > 0) {
        expect(result.rows[0].airline).toBe('Vietnam Airlines');
      }
    });

    test('should have correct flight schema', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'flights'
      `);
      
      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('flight_code');
      expect(columns).toContain('airline');
      expect(columns).toContain('status');
    });
  });

  describe('Airports Table', () => {
    
    test('airports table should exist', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'airports'
        )
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have airport data', async () => {
      const result = await pool.query('SELECT COUNT(*) FROM airports');
      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(4);
    });

    test('should query airport by code', async () => {
      const result = await pool.query(
        'SELECT * FROM airports WHERE airport_code = $1',
        ['SGN']
      );
      
      if (result.rows.length > 0) {
        expect(result.rows[0].city).toMatch(/ho chi minh/i);
      }
    });
  });

  describe('Weather Table', () => {
    
    test('weather table should exist', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'weather'
        )
      `);
      expect(result.rows[0].exists).toBe(true);
    });

    test('should have weather data', async () => {
      const result = await pool.query('SELECT COUNT(*) FROM weather');
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });

    test('temperature should be in valid range', async () => {
      const result = await pool.query('SELECT temperature FROM weather');
      
      result.rows.forEach(row => {
        expect(row.temperature).toBeGreaterThanOrEqual(0);
        expect(row.temperature).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('Data Relationships', () => {
    
    test('flights should reference valid airports', async () => {
      const result = await pool.query(`
        SELECT f.flight_code, f.from_airport, f.to_airport
        FROM flights f
        LEFT JOIN airports a1 ON f.from_airport = a1.airport_code
        LEFT JOIN airports a2 ON f.to_airport = a2.airport_code
        WHERE a1.airport_code IS NULL OR a2.airport_code IS NULL
      `);
      
      // All flights should have valid airport references
      expect(result.rows.length).toBe(0);
    });

    test('weather should reference valid airports', async () => {
      const result = await pool.query(`
        SELECT w.airport_code
        FROM weather w
        LEFT JOIN airports a ON w.airport_code = a.airport_code
        WHERE a.airport_code IS NULL
      `);
      
      expect(result.rows.length).toBe(0);
    });
  });
});
