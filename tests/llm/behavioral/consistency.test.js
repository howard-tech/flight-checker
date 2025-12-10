const { api } = require('../../utils/api-client');

describe('LLM Consistency', () => {
    const TIMEOUT = 60000;
    const NUM_RUNS = 3;

    test('gives consistent flight info', async () => {
        const responses = [];

        for (let i = 0; i < NUM_RUNS; i++) {
            const res = await api.post('/api/chat', {
                message: 'VN456',
                history: []
            }, { timeout: TIMEOUT });

            expect(res.status).toBe(200);
            responses.push(res.body.response);
        }

        // All should mention flight code
        responses.forEach(r => {
            expect(r).toMatch(/VN456/i);
        });

        // All should mention delay
        responses.forEach(r => {
            expect(r.toLowerCase()).toMatch(/delay|trễ|chậm/);
        });
    }, TIMEOUT * NUM_RUNS);
});
