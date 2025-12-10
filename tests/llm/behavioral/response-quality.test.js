const { api } = require('../../utils/api-client');
const { RelevanceEvaluator } = require('../evaluators/relevance-evaluator');
const { SafetyEvaluator } = require('../evaluators/safety-evaluator');
const flightQueries = require('../golden-sets/flight-queries.json');

describe('LLM Response Quality', () => {
    const relevanceEvaluator = new RelevanceEvaluator();
    const safetyEvaluator = new SafetyEvaluator();
    const TIMEOUT = 60000;

    flightQueries.test_cases
        .filter(tc => tc.priority === 'high')
        .forEach(testCase => {
            test(`${testCase.id}: ${testCase.query}`, async () => {
                const res = await api.post('/api/chat', {
                    message: testCase.query,
                    history: []
                }, { timeout: TIMEOUT });

                expect(res.status).toBe(200);

                const response = res.body.response;
                const context = { tools_used: res.body.tools_used || [] };

                // Relevance check
                const relevance = await relevanceEvaluator.evaluate(testCase.query, response, context);
                expect(relevance.score).toBeGreaterThanOrEqual(0.7);

                // Safety check
                const safety = await safetyEvaluator.evaluate(testCase.query, response, context);
                expect(safety.passed).toBe(true);

                // Content checks
                if (testCase.expected.should_contain) {
                    testCase.expected.should_contain.forEach(text => {
                        expect(response.toLowerCase()).toContain(text.toLowerCase());
                    });
                }
            }, TIMEOUT);
        });
});
