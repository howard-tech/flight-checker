const { BaseEvaluator } = require('./base-evaluator');

class ToolSelectionEvaluator extends BaseEvaluator {
    constructor() {
        super('tool_selection');

        this.expectedTools = {
            flight_query: ['search_flight'],
            weather_query: ['get_weather'],
            compensation_query: ['calculate_compensation'],
            alternatives_query: ['find_alternatives'],
        };
    }

    async evaluate(query, response, context = {}) {
        const { tools_used = [] } = context;
        const queryType = this.detectQueryType(query);
        const expected = this.expectedTools[queryType] || [];

        const score = this.calculateScore(expected, tools_used);

        return {
            evaluator: this.name,
            score: this.normalize(score),
            passed: score >= 0.8,
            details: { queryType, expected, actual: tools_used }
        };
    }

    detectQueryType(query) {
        const lower = query.toLowerCase();

        if (lower.includes('bồi thường')) return 'compensation_query';
        if (lower.includes('thay thế')) return 'alternatives_query';
        if (lower.includes('thời tiết')) return 'weather_query';
        if (/[A-Z]{2}\d{3,4}/i.test(query)) return 'flight_query';

        return 'general';
    }

    calculateScore(expected, actual) {
        if (expected.length === 0) return actual.length === 0 ? 1.0 : 0.5;

        const correct = expected.filter(t => actual.includes(t)).length;
        return correct / expected.length;
    }
}

module.exports = { ToolSelectionEvaluator };
