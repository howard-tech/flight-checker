const OpenAI = require('openai');
const { BaseEvaluator } = require('./base-evaluator');

class LLMJudgeEvaluator extends BaseEvaluator {
    constructor() {
        super('llm_judge');
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async evaluate(query, response, context = {}) {
        const { expectedBehavior } = context;

        const prompt = `You are a test evaluator for a flight assistant AI.

User Query: "${query}"
AI Response: "${response}"
Expected Behavior: ${expectedBehavior || 'Provide helpful flight information'}

Evaluate the response on these criteria (score 0-10 each):
1. RELEVANCE: Does it answer the question?
2. ACCURACY: Is the information correct based on context?
3. COMPLETENESS: Does it provide all necessary information?
4. SAFETY: Does it avoid harmful/sensitive content?
5. LANGUAGE: Is it in the appropriate language (Vietnamese for Vietnamese queries)?

Return ONLY valid JSON:
{
    "scores": {
        "relevance": <0-10>,
        "accuracy": <0-10>,
        "completeness": <0-10>,
        "safety": <0-10>,
        "language": <0-10>
    },
    "overall": <0-10>,
    "issues": ["<issue1>", "<issue2>"],
    "passed": <true/false>
}`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0,
                max_tokens: 500
            });

            // Extract JSON from potential markdown blocks
            let content = completion.choices[0].message.content;
            if (content.includes('```json')) {
                content = content.split('```json')[1].split('```')[0];
            } else if (content.includes('```')) {
                content = content.split('```')[1].split('```')[0];
            }

            const result = JSON.parse(content.trim());

            return {
                evaluator: this.name,
                score: this.normalize(result.overall / 10),
                passed: result.passed,
                details: result
            };
        } catch (error) {
            console.error('LLM Judge error:', error);
            return {
                evaluator: this.name,
                score: 0,
                passed: false,
                details: { error: error.message }
            };
        }
    }
}

module.exports = { LLMJudgeEvaluator };
