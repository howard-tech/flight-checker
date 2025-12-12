const { api } = require('../../utils/api-client');
const { ContextRetentionEvaluator } = require('../evaluators/context-evaluator');
const multiTurnQueries = require('../golden-sets/multi-turn-queries.json');

describe('Multi-turn Conversations', () => {
    const contextEvaluator = new ContextRetentionEvaluator();
    const TIMEOUT = 60000;

    multiTurnQueries.test_cases.forEach(testCase => {
        test(`${testCase.id}: ${testCase.name}`, async () => {
            const history = [];

            for (let i = 0; i < testCase.turns.length; i++) {
                const turn = testCase.turns[i];

                const res = await api.post('/api/chat', {
                    message: turn.query,
                    history: history // Server expects array of messages
                }, { timeout: TIMEOUT });

                expect(res.status).toBe(200);
                const response = res.body.response;

                // Update history
                history.push({ role: 'user', content: turn.query });
                history.push({ role: 'assistant', content: response });

                // Check turn-specific expectations
                const expected = turn.expected;

                if (expected.should_contain) {
                    expected.should_contain.forEach(text => {
                        expect(response).toContain(text);
                    });
                }

                if (expected.should_contain_any) {
                    const hasAny = expected.should_contain_any.some(text =>
                        response.toLowerCase().includes(text.toLowerCase())
                    );
                    expect(hasAny).toBe(true);
                }

                if (expected.should_not_contain) {
                    expected.should_not_contain.forEach(text => {
                        expect(response).not.toContain(text);
                    });
                }

                if (expected.should_remember_flight) {
                    expect(response.toUpperCase()).toContain(expected.should_remember_flight);
                }

                // Context retention check for turns after first
                if (i > 0 && expected.should_remember_flight) {
                    const evalResult = await contextEvaluator.evaluate(
                        turn.query,
                        response,
                        {
                            conversationHistory: history.slice(0, -2),
                            expectedContext: [expected.should_remember_flight]
                        }
                    );
                    expect(evalResult.passed).toBe(true);
                }
            }
        }, TIMEOUT * testCase.turns.length);
    });
});
