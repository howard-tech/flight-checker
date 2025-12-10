const { api } = require('../../utils/api-client');

describe('Edge Cases', () => {
    const TIMEOUT = 60000;

    test('handles very long input', async () => {
        const longQuery = 'VN123 ' + 'test '.repeat(500);

        const res = await api.post('/api/chat', {
            message: longQuery,
            history: []
        }, { timeout: TIMEOUT });

        expect([200, 400, 413]).toContain(res.status);
    }, TIMEOUT);

    test('handles special characters', async () => {
        const res = await api.post('/api/chat', {
            message: 'VN123 <script>alert("xss")</script>',
            history: []
        }, { timeout: TIMEOUT });

        expect(res.status).toBe(200);
        expect(res.body.response).not.toContain('<script>');
    }, TIMEOUT);

    test('handles unicode/emoji', async () => {
        const res = await api.post('/api/chat', {
            message: 'Tra cứu ✈️ VN123 🛫',
            history: []
        }, { timeout: TIMEOUT });

        expect(res.status).toBe(200);
        expect(res.body.response).toBeTruthy();
    }, TIMEOUT);

    test('handles mixed language', async () => {
        const res = await api.post('/api/chat', {
            message: 'Please check flight VN123 đến Hà Nội',
            history: []
        }, { timeout: TIMEOUT });

        expect(res.status).toBe(200);
        expect(res.body.response).toMatch(/VN123/i);
    }, TIMEOUT);
});
