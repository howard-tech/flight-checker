const { api } = require('../utils/api-client');

describe('API Load Testing', () => {
    let flightCodes = [];

    beforeAll(async () => {
        // Get actual flights from the database
        const res = await api.get('/api/flights');
        if (res.status === 200 && Array.isArray(res.body)) {
            flightCodes = res.body.map(f => f.flight_code);
        }
        // Fallback to known flight codes if API fails
        if (flightCodes.length === 0) {
            flightCodes = ['VN123', 'VN456', 'VJ789', 'QH101', 'BL101'];
        }
    });

    const CONCURRENCY = 50; // Requests at once
    const TOTAL_REQUESTS = 200;

    test(`handles ${CONCURRENCY} concurrent search requests`, async () => {
        const requests = [];

        const startTime = Date.now();

        for (let i = 0; i < TOTAL_REQUESTS; i++) {
            const code = flightCodes[i % flightCodes.length];
            requests.push(api.post('/api/mcp/search_flight', { flight_code: code }));
        }

        // Execute in batches to simulate concurrency
        const batches = [];
        for (let i = 0; i < requests.length; i += CONCURRENCY) {
            const batch = requests.slice(i, i + CONCURRENCY);
            batches.push(Promise.all(batch));
        }

        const results = (await Promise.all(batches)).flat();
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / TOTAL_REQUESTS;

        const successCount = results.filter(r => r.status === 200).length;
        const errorCount = results.filter(r => r.status !== 200).length;

        console.log(`Load Test Results:
      Total Requests: ${TOTAL_REQUESTS}
      Concurrency: ${CONCURRENCY}
      Total Time: ${totalTime}ms
      Avg Time/Req: ${avgTime.toFixed(2)}ms
      Success: ${successCount}
      Errors: ${errorCount}
    `);

        expect(successCount).toBe(TOTAL_REQUESTS);
        expect(avgTime).toBeLessThan(200); // 200ms expectation per req avg
    }, 120000); // Long timeout
});

