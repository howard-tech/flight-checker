const { api } = require('../utils/api-client');
const { resetTestDatabase } = require('../utils/db-setup');

describe('Security: SQL Injection', () => {
    beforeAll(async () => {
        await resetTestDatabase();
    });

    const injectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE flights; --",
        "VN123' UNION SELECT username, password FROM users --",
        "1; UPDATE flights SET price = 0"
    ];

    describe('GET /api/flights/:code', () => {
        injectionPayloads.forEach(payload => {
            test(`resists injection: ${payload}`, async () => {
                const res = await api.get(`/api/flights/${encodeURIComponent(payload)}`);
                // Should be 404 (Not Found) or 400 (Bad Request), but definitely NOT 200/500 with leak
                // And definitely should still have the table afterwards
                expect([400, 404]).toContain(res.status);
            });
        });
    });

    describe('POST /api/mcp/search_flight', () => {
        injectionPayloads.forEach(payload => {
            test(`resists injection in body: ${payload}`, async () => {
                const res = await api.post('/api/mcp/search_flight', {
                    flight_code: payload
                });
                // Should return empty or 404/400
                if (res.status === 200) {
                    // If 200, ensure it didn't return all rows
                    if (Array.isArray(res.body)) {
                        expect(res.body.length).toBeLessThan(10);
                    }
                } else {
                    expect([400, 404]).toContain(res.status);
                }
            });
        });
    });

    test('Flights table still exists after drop attempt', async () => {
        const res = await api.get('/api/flights');
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
    });
});
