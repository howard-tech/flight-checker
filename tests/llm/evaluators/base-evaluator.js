class BaseEvaluator {
    constructor(name) {
        this.name = name;
    }

    async evaluate(query, response, context = {}) {
        throw new Error('evaluate() must be implemented');
    }

    normalize(score) {
        return Math.max(0, Math.min(1, score));
    }
}

module.exports = { BaseEvaluator };
