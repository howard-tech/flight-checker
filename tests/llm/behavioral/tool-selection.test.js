const { api } = require('../../utils/api-client');
const { ToolSelectionEvaluator } = require('../evaluators/tool-selection-evaluator');

describe('LLM Tool Selection', () => {
    const evaluator = new ToolSelectionEvaluator();
    const TIMEOUT = 60000;

    const testCases = [
        { query: 'VN123', expectedTools: ['search_flight'] },
        { query: 'Thời tiết sân bay SGN', expectedTools: ['get_weather'] },
        { query: 'Delay 4 tiếng, vé 3 triệu, bồi thường?', expectedTools: ['calculate_compensation'] },
        { query: 'QH101 hủy, có chuyến thay thế?', expectedTools: ['find_alternatives'] },
    ];

    testCases.forEach(({ query, expectedTools }) => {
        test(`selects correct tools for: "${query}"`, async () => {
            const res = await api.post('/api/chat', {
                message: query,
                history: []
            }, { timeout: TIMEOUT });

            expect(res.status).toBe(200);

            const result = await evaluator.evaluate(
                query,
                res.body.response,
                { tools_used: res.body.tools_used || [] }
            );

            expect(result.score).toBeGreaterThanOrEqual(0.8);
        }, TIMEOUT);
    });
});
