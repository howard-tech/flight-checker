const { getPool } = require('./db-setup');

const AIRLINES = [
    'Vietnam Airlines',
    'VietJet Air',
    'Bamboo Airways',
    'Pacific Airlines',
    'Vietravel Airlines'
];

const AIRPORTS = ['SGN', 'HAN', 'DAD'];
const STATUSES = ['On Time', 'Delayed', 'Cancelled', 'Boarding', 'Arrived'];

// Simple random helpers
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randCode = () => {
    const airline = rand(['VN', 'VJ', 'QH', 'BL', 'VU']);
    const num = randInt(1000, 9999);
    return `${airline}${num}`;
};

class AdvancedSeeder {
    constructor() {
        this.pool = getPool();
    }

    generateFlight(override = {}) {
        const from = override.from_airport || rand(AIRPORTS);
        let to = override.to_airport || rand(AIRPORTS);
        while (to === from) {
            to = rand(AIRPORTS);
        }

        const now = new Date();
        // Flight in next 24 hours
        const departure = new Date(now.getTime() + randInt(3600000, 86400000));
        // Duration 1-3h
        const arrival = new Date(departure.getTime() + randInt(3600000, 10800000));

        const status = override.status || rand(STATUSES);
        const isDelayed = status === 'Delayed';
        const delayMinutes = isDelayed ? randInt(15, 240) : 0;

        return {
            flight_code: override.flight_code || randCode(),
            airline: override.airline || rand(AIRLINES),
            from_airport: from,
            to_airport: to,
            departure_time: departure.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            arrival_time: arrival.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            status: status,
            gate: `${rand(['A', 'B', 'C', 'D'])}${randInt(1, 20)}`,
            terminal: rand(['T1', 'T2']),
            aircraft: rand(['A320', 'A321', 'A350', 'B787']),
            price: randInt(500000, 5000000),
            delay_minutes: delayMinutes,
            delay_reason: isDelayed ? rand(['Weather', 'Technical', 'Operational']) : null
        };
    }

    async seedFlights(count = 50) {
        const client = await this.pool.connect();
        try {
            const flights = [];
            const usedCodes = new Set();

            while (flights.length < count) {
                const flight = this.generateFlight();
                if (!usedCodes.has(flight.flight_code)) {
                    usedCodes.add(flight.flight_code);
                    flights.push(flight);
                }
            }

            await client.query('BEGIN');

            const insertQuery = `
        INSERT INTO flights 
        (flight_code, airline, from_airport, to_airport, departure_time, arrival_time, status, gate, terminal, aircraft, price, delay_minutes, delay_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `;

            for (const flight of flights) {
                await client.query(insertQuery, [
                    flight.flight_code,
                    flight.airline,
                    flight.from_airport,
                    flight.to_airport,
                    flight.departure_time,
                    flight.arrival_time,
                    flight.status,
                    flight.gate,
                    flight.terminal,
                    flight.aircraft,
                    flight.price,
                    flight.delay_minutes,
                    flight.delay_reason
                ]);
            }

            await client.query('COMMIT');
            console.log(`Seeded ${count} flights successfully`);
            return flights;
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Error seeding flights:', e);
            throw e;
        } finally {
            client.release();
        }
    }

    async seedWeather() {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('TRUNCATE TABLE weather');

            for (const code of AIRPORTS) {
                await client.query(`
          INSERT INTO weather (airport_code, temperature, condition, humidity, wind_speed, visibility)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
                    code,
                    randInt(20, 35),
                    rand(['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Clear']),
                    randInt(50, 90),
                    `${randInt(5, 30)} km/h`,
                    rand(['Good', 'Moderate', 'Poor'])
                ]);
            }

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}

module.exports = { AdvancedSeeder };
