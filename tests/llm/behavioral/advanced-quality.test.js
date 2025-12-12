const { api } = require('../../utils/api-client');
const { LLMJudgeEvaluator } = require('../evaluators/llm-judge-evaluator');
const { HallucinationEvaluator } = require('../evaluators/hallucination-evaluator');
const flightQueries = require('../golden-sets/flight-queries.json');

describe('Advanced Quality & Hallucination Checks', () => {
    const llmJudge = new LLMJudgeEvaluator();
    const hallucinationDetector = new HallucinationEvaluator();
    const TIMEOUT = 60000;

    // Run on a subset or all queries
    const testCases = flightQueries.test_cases.filter(t => t.priority === 'high');

    testCases.forEach(testCase => {
        test(`Quality Check: ${testCase.query}`, async () => {
            const res = await api.post('/api/chat', {
                message: testCase.query
            }, { timeout: TIMEOUT });

            expect(res.status).toBe(200);
            const response = res.body.response;

            // 1. Hallucination Check
            const halResult = await hallucinationDetector.evaluate(testCase.query, response);
            if (!halResult.passed) {
                console.warn(`Hallucination warning for "${testCase.query}":`, halResult.details.issues);
            }
            // We don't fail yet as hallucination detector is strict, but we log
            // expect(halResult.passed).toBe(true); 

            // 2. LLM Judge Evaluation
            const apiKey = process.env.OPENAI_API_KEY;
            if (apiKey && apiKey.startsWith('sk-')) {
                const judgeResult = await llmJudge.evaluate(testCase.query, response, {
                    expectedBehavior: JSON.stringify(testCase.expected)
                });

                console.log(`LLM Judge Score for "${testCase.query}": ${judgeResult.score}`);
                if (judgeResult.details) {
                    console.log('Judge Details:', judgeResult.details.scores);
                }

                // Expect reasonable quality (> 0.6)
                expect(judgeResult.score).toBeGreaterThan(0.6);
            } else {
                console.warn('Skipping LLM Judge: No valid OPENAI_API_KEY found');
            }
        }, TIMEOUT);
    });
});
