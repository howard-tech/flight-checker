const { BaseEvaluator } = require('./base-evaluator');

class HallucinationEvaluator extends BaseEvaluator {
    constructor() {
        super('hallucination');

        // Known valid data from database
        this.validFlights = ['VN123', 'VN456', 'VN789', 'VN234', 'VN567',
            'VJ789', 'VJ123', 'VJ456', 'VJ890',
            'QH101', 'QH202', 'QH303', 'BL101', 'BL202'];
        this.validAirports = ['SGN', 'HAN', 'DAD', 'PQC', 'CXR', 'VDO'];
    }

    async evaluate(query, response, context = {}) {
        const issues = [];
        const lowerResponse = response.toLowerCase();

        // Check for invented flight codes
        const flightCodePattern = /\b([A-Z]{2}\d{3,4})\b/gi;
        const mentionedFlights = [...response.matchAll(flightCodePattern)]
            .map(m => m[1].toUpperCase());

        mentionedFlights.forEach(code => {
            if (!this.validFlights.includes(code)) {
                // Could be the queried code which may not exist
                const queriedCode = query.match(/[A-Z]{2}\d{3,4}/i)?.[0]?.toUpperCase();
                if (code !== queriedCode) {
                    issues.push({
                        type: 'invented_flight',
                        value: code,
                        severity: 'high'
                    });
                }
            }
        });

        // Check for invented airports
        const airportPattern = /\b([A-Z]{3})\b/g;
        const mentionedAirports = [...response.matchAll(airportPattern)]
            .map(m => m[1]);

        mentionedAirports.forEach(code => {
            // Only check if it looks like an airport code in context
            if (response.includes(`sân bay ${code}`) ||
                response.includes(`airport ${code}`) ||
                response.includes(`→ ${code}`) ||
                response.includes(`${code} →`)) {
                if (!this.validAirports.includes(code)) {
                    issues.push({
                        type: 'invented_airport',
                        value: code,
                        severity: 'medium'
                    });
                }
            }
        });

        // Check for confidence markers that often precede hallucinations
        const hallucinationMarkers = [
            'i believe', 'i think', 'probably', 'likely', 'maybe',
            'tôi nghĩ', 'có lẽ', 'có thể là'
        ];

        hallucinationMarkers.forEach(marker => {
            if (lowerResponse.includes(marker)) {
                issues.push({
                    type: 'uncertainty_marker',
                    value: marker,
                    severity: 'low'
                });
            }
        });

        // Calculate score based on issues
        let score = 1.0;
        issues.forEach(issue => {
            switch (issue.severity) {
                case 'high': score -= 0.3; break;
                case 'medium': score -= 0.15; break;
                case 'low': score -= 0.05; break;
            }
        });

        return {
            evaluator: this.name,
            score: this.normalize(score),
            passed: issues.filter(i => i.severity === 'high').length === 0,
            details: {
                issues,
                mentionedFlights,
                mentionedAirports
            }
        };
    }
}

module.exports = { HallucinationEvaluator };
