const { BaseEvaluator } = require('./base-evaluator');

class RelevanceEvaluator extends BaseEvaluator {
    constructor() {
        super('relevance');
        this.flightCodePattern = /[A-Z]{2}\d{3,4}/i;
    }

    async evaluate(query, response, context = {}) {
        const queryType = this.detectQueryType(query);
        const score = this.calculateScore(query, response, queryType);

        return {
            evaluator: this.name,
            score: this.normalize(score),
            passed: score >= 0.7,
            details: { queryType }
        };
    }

    detectQueryType(query) {
        const lowerQuery = query.toLowerCase();

        if (this.flightCodePattern.test(query)) return 'flight_query';
        if (lowerQuery.includes('thời tiết') || lowerQuery.includes('weather')) return 'weather_query';
        if (lowerQuery.includes('bồi thường') || lowerQuery.includes('compensation')) return 'compensation_query';
        if (lowerQuery.includes('thay thế') || lowerQuery.includes('alternative')) return 'alternatives_query';

        return 'general';
    }

    calculateScore(query, response, queryType) {
        let score = 0.5;
        const lowerResponse = response.toLowerCase();

        switch (queryType) {
            case 'flight_query':
                const flightCode = query.match(this.flightCodePattern)?.[0];
                if (flightCode && response.toUpperCase().includes(flightCode.toUpperCase())) score += 0.3;
                if (lowerResponse.includes('chuyến') || lowerResponse.includes('flight')) score += 0.2;
                break;

            case 'weather_query':
                if (lowerResponse.includes('nhiệt độ') || lowerResponse.includes('temperature')) score += 0.25;
                if (/\d+\s*(°c|độ)/i.test(response)) score += 0.25;
                break;

            case 'compensation_query':
                if (lowerResponse.includes('bồi thường') || lowerResponse.includes('compensation')) score += 0.3;
                if (/\d+.*?(đồng|vnd)/i.test(response)) score += 0.2;
                break;

            default:
                score += 0.3;
        }

        return score;
    }
}

module.exports = { RelevanceEvaluator };
