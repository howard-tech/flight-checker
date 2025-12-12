const { BaseEvaluator } = require('./base-evaluator');

class ContextRetentionEvaluator extends BaseEvaluator {
    constructor() {
        super('context_retention');
    }

    async evaluate(query, response, context = {}) {
        const { conversationHistory = [], expectedContext = [] } = context;
        const issues = [];
        let retainedCount = 0;

        // Check if response references relevant history
        expectedContext.forEach(expected => {
            const found = response.toLowerCase().includes(expected.toLowerCase()) ||
                this.semanticMatch(response, expected);
            if (found) {
                retainedCount++;
            } else {
                issues.push({
                    type: 'missing_context',
                    expected: expected
                });
            }
        });

        // Check for context confusion
        const currentFlightCode = query.match(/[A-Z]{2}\d{3,4}/i)?.[0];
        const previousFlightCode = this.extractFlightFromHistory(conversationHistory);

        if (currentFlightCode && previousFlightCode &&
            currentFlightCode !== previousFlightCode) {
            // Query is about different flight - should not confuse
            if (response.includes(previousFlightCode)) {
                issues.push({
                    type: 'context_confusion',
                    message: `Mixed up ${currentFlightCode} with ${previousFlightCode}`
                });
            }
        }

        const score = expectedContext.length > 0
            ? retainedCount / expectedContext.length
            : issues.length === 0 ? 1.0 : 0.7;

        return {
            evaluator: this.name,
            score: this.normalize(score),
            passed: issues.filter(i => i.type === 'context_confusion').length === 0,
            details: {
                retainedCount,
                expectedCount: expectedContext.length,
                issues
            }
        };
    }

    extractFlightFromHistory(history) {
        if (!history) return null;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].role === 'user') { // Only user intent typically establishes context
                const match = history[i].content.match(/[A-Z]{2}\d{3,4}/i);
                if (match) return match[0].toUpperCase();
            }
        }
        return null;
    }

    semanticMatch(response, expected) {
        // Simple semantic matching
        const synonyms = {
            'delay': ['trễ', 'chậm', 'muộn', 'delayed'],
            'cancel': ['hủy', 'cancelled', 'đã hủy'],
            'weather': ['thời tiết', 'mưa', 'nắng', 'nhiệt độ'],
            'compensation': ['bồi thường', 'hoàn tiền', 'đền bù', 'compensat', 'refund']
        };

        const expectedLower = expected.toLowerCase();
        for (const [key, values] of Object.entries(synonyms)) {
            if (values.includes(expectedLower) || key === expectedLower) {
                return values.some(v => response.toLowerCase().includes(v));
            }
        }
        return false;
    }
}

module.exports = { ContextRetentionEvaluator };
