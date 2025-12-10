const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../__config__/.env.test' });

let pool;

const getPool = () => {
    if (!pool) {
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
    }
    return pool;
};

const resetTestDatabase = async () => {
    const db = getPool();

    await db.query('BEGIN');
    try {
        await db.query('TRUNCATE TABLE flights, weather, airports RESTART IDENTITY CASCADE');

        // Seed airports
        await db.query(`
      INSERT INTO airports (airport_code, name, city, lounges) VALUES
      ('SGN', 'Tan Son Nhat International', 'Ho Chi Minh City', ARRAY['CIP Orchid', 'Le Saigonnais']),
      ('HAN', 'Noi Bai International', 'Hanoi', ARRAY['Song Hong Business']),
      ('DAD', 'Da Nang International', 'Da Nang', ARRAY['CIP Lounge']),
      ('PQC', 'Phu Quoc International', 'Phu Quoc', ARRAY['Pearl Lounge'])
    `);

        // Seed flights
        await db.query(`
      INSERT INTO flights (flight_code, airline, from_airport, to_airport, departure_time, arrival_time, status, gate, terminal, aircraft, price, delay_minutes, delay_reason) VALUES
      ('VN123', 'Vietnam Airlines', 'SGN', 'HAN', '08:00', '10:15', 'On Time', 'A1', 'T1', 'A321', 2500000, 0, NULL),
      ('VN456', 'Vietnam Airlines', 'SGN', 'DAD', '09:30', '10:45', 'Delayed', 'B3', 'T1', 'A320', 1800000, 45, 'Weather conditions'),
      ('QH101', 'Bamboo Airways', 'HAN', 'PQC', '14:00', '16:30', 'Cancelled', NULL, 'T2', 'A321', 2200000, 0, 'Technical issues'),
      ('VJ201', 'VietJet Air', 'DAD', 'SGN', '11:00', '12:15', 'On Time', 'C2', 'T1', 'A320', 1500000, 0, NULL)
    `);

        // Seed weather
        await db.query(`
      INSERT INTO weather (airport_code, temperature, condition, humidity, wind_speed, visibility) VALUES
      ('SGN', 32, 'Sunny', 75, '10 km/h', 'Good'),
      ('HAN', 28, 'Cloudy', 80, '15 km/h', 'Good'),
      ('DAD', 30, 'Partly Cloudy', 70, '12 km/h', 'Good'),
      ('PQC', 31, 'Clear', 78, '8 km/h', 'Excellent')
    `);

        await db.query('COMMIT');
    } catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }
};

const closePool = async () => {
    if (pool) {
        await pool.end();
        pool = null;
    }
};

module.exports = { getPool, resetTestDatabase, closePool };
