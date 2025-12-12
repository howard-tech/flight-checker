# Flight Checker AI - Advanced Testing Plan

> **Tài liệu này dành cho Antigravity Agent**  
> Mục tiêu: Review code hiện tại và implement advanced testing cho AI system  
> Ngày tạo: December 2024

---

## Mục Lục

1. [Code Review - Đánh Giá Hiện Trạng](#1-code-review---đánh-giá-hiện-trạng)
2. [Test Coverage Analysis - Gaps & Missing Scenarios](#2-test-coverage-analysis---gaps--missing-scenarios)
3. [Advanced LLM Testing Improvements](#3-advanced-llm-testing-improvements)
4. [Advanced MCP Testing Improvements](#4-advanced-mcp-testing-improvements)
5. [Advanced A2A Testing Improvements](#5-advanced-a2a-testing-improvements)
6. [Implementation Tasks](#6-implementation-tasks)
7. [Best Practices Checklist](#7-best-practices-checklist)

---

## 1. Code Review - Đánh Giá Hiện Trạng

### 1.1 Structure Assessment ✅ Tốt

```
tests/
├── __config__/           ✅ Tách biệt config
│   ├── jest.config.js    ✅ Module aliases
│   ├── playwright.config.ts  ✅ Multi-browser support
│   └── .env.test         ✅ Environment isolation
├── api/                  ✅ API tests đầy đủ
├── e2e/                  ✅ Page Object Model
├── fixtures/             ⚠️ Thiếu dữ liệu test
├── integration/          ✅ DB connection tests
├── llm/                  ✅ Behavioral tests structure
│   ├── adversarial/      ✅ Security tests
│   ├── behavioral/       ✅ Quality tests
│   ├── evaluators/       ⚠️ Basic evaluators only
│   └── golden-sets/      ⚠️ Ít test cases
└── utils/                ✅ Helpers đầy đủ
```

### 1.2 Code Quality Issues

#### ❌ Issue 1: Evaluators thiếu depth
**File:** `tests/llm/evaluators/relevance-evaluator.js`
```javascript
// HIỆN TẠI: Chỉ check keyword matching
calculateScore(query, response, queryType) {
    let score = 0.5;
    // ... chỉ check includes()
}

// CẦN: Semantic similarity, entity extraction
```

#### ❌ Issue 2: Tool Selection không track actual tools
**File:** `tests/llm/behavioral/tool-selection.test.js`
```javascript
// HIỆN TẠI: tools_used luôn empty vì server không return
const result = await evaluator.evaluate(
    query,
    res.body.response,
    { tools_used: res.body.tools_used || [] }  // Luôn []
);

// CẦN: Server phải return tools_used trong response
```

#### ❌ Issue 3: Server không return tool usage info
**File:** `server/index.js` (line 420-426)
```javascript
// HIỆN TẠI:
res.json({
    success: true,
    response: assistantMessage.content,
    logs,
    usage: response.usage
});

// THIẾU: tools_used array để test tool selection
```

#### ⚠️ Issue 4: Compensation logic inconsistency
**File:** `server/index.js` vs `tests/utils/test-helpers.js`
```javascript
// Server (line 256-268): 1-2h = 15%, 2-3h = 30%, >3h = 50%
// Test helper (line 89-96): <2h = 0%, 2-3h = 25%, >3h = 50%
// CONFLICT: 25% vs 30% for 2-3h delay
```

### 1.3 Patterns Assessment

| Pattern | Status | Notes |
|---------|--------|-------|
| Page Object Model | ✅ | `ChatPage.ts` implemented |
| Test Fixtures | ⚠️ | Basic - cần expand |
| Test Isolation | ✅ | `resetTestDatabase()` |
| Retry Logic | ✅ | `retry()` helper |
| Error Handling | ⚠️ | Thiếu negative tests |
| Timeouts | ✅ | 60s for LLM calls |
| Evaluator Pattern | ⚠️ | Basic - cần LLM-as-judge |

---

## 2. Test Coverage Analysis - Gaps & Missing Scenarios

### 2.1 API Coverage Gaps

| Endpoint | Covered | Missing Tests |
|----------|---------|---------------|
| `GET /api/health` | ✅ | DB disconnected scenario |
| `POST /api/chat` | ⚠️ | Rate limiting, concurrent, very long history |
| `GET /api/flights` | ⚠️ | Pagination, filtering, empty results |
| `GET /api/flights/:code` | ⚠️ | SQL injection, case sensitivity |
| `GET /api/airports` | ⚠️ | Empty database |
| `GET /api/weather` | ⚠️ | Missing airport weather |
| `POST /api/mcp/search_flight` | ⚠️ | Partial match, wildcard |
| `POST /api/mcp/get_weather` | ⚠️ | Invalid codes, null values |
| `POST /api/mcp/calculate_compensation` | ✅ | Edge cases (0, negative) |
| `POST /api/mcp/find_alternatives` | ⚠️ | No alternatives found |
| `POST /api/mcp/list_flights` | ❌ | Not tested |
| `POST /api/mcp/get_airport_info` | ❌ | Not tested |

### 2.2 LLM Test Coverage Gaps

| Scenario | Covered | Priority |
|----------|---------|----------|
| Flight query - On Time | ✅ | - |
| Flight query - Delayed | ✅ | - |
| Flight query - Cancelled | ✅ | - |
| Flight query - Not found | ⚠️ | High |
| Weather query - Valid | ⚠️ | High |
| Weather query - Invalid | ❌ | High |
| Compensation - Eligible | ✅ | - |
| Compensation - Not eligible | ✅ | - |
| Multi-turn context | ⚠️ | High |
| Language switching | ❌ | Medium |
| Tool chaining | ❌ | Critical |
| Error recovery | ❌ | High |
| Hallucination detection | ❌ | Critical |

### 2.3 E2E Coverage Gaps

| User Flow | Covered | Missing |
|-----------|---------|---------|
| Flight search | ✅ | Mobile responsive, error states |
| Weather query | ✅ | Loading states |
| Multi-turn chat | ✅ | Clear chat, session persistence |
| API disconnected | ❌ | Critical |
| Slow response | ❌ | High |
| Flights tab | ❌ | Medium |
| Weather tab | ❌ | Medium |

### 2.4 Integration Coverage Gaps

| Integration | Covered | Missing |
|-------------|---------|---------|
| DB Connection | ✅ | Pool exhaustion |
| DB CRUD | ✅ | Transactions |
| OpenAI API | ❌ | Mock needed |
| MCP → DB | ⚠️ | Error propagation |
| A2A flow | ❌ | Not tested |

---

## 3. Advanced LLM Testing Improvements

### 3.1 LLM-as-Judge Evaluator

**Tạo file:** `tests/llm/evaluators/llm-judge-evaluator.js`

```javascript
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
        const { expectedBehavior, criteria } = context;

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

            const result = JSON.parse(completion.choices[0].message.content);

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
```

### 3.2 Hallucination Detector

**Tạo file:** `tests/llm/evaluators/hallucination-evaluator.js`

```javascript
const { BaseEvaluator } = require('./base-evaluator');

class HallucinationEvaluator extends BaseEvaluator {
    constructor() {
        super('hallucination');

        // Known valid data from database
        this.validFlights = ['VN123', 'VN456', 'VN789', 'VN234', 'VN567',
                            'VJ789', 'VJ123', 'VJ456', 'VJ890',
                            'QH101', 'QH202', 'QH303', 'BL101', 'BL202'];
        this.validAirports = ['SGN', 'HAN', 'DAD', 'PQC', 'CXR', 'VDO'];
        this.validAirlines = ['Vietnam Airlines', 'VietJet Air', 'Bamboo Airways', 'Pacific Airlines'];
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

        // Check for specific invented data patterns
        const inventedPatterns = [
            { pattern: /gate\s+[A-Z]\d{1,2}/i, context: 'gate_number' },
            { pattern: /terminal\s+\d+/i, context: 'terminal' },
            { pattern: /(\d{1,2}[:.]\d{2})\s*(am|pm)?/gi, context: 'time' }
        ];

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
```

### 3.3 Context Retention Evaluator

**Tạo file:** `tests/llm/evaluators/context-evaluator.js`

```javascript
const { BaseEvaluator } = require('./base-evaluator');

class ContextRetentionEvaluator extends BaseEvaluator {
    constructor() {
        super('context_retention');
    }

    async evaluate(query, response, context = {}) {
        const { conversationHistory = [], expectedContext = [] } = context;
        const issues = [];
        let retainedCount = 0;

        // Extract key entities from history
        const historyEntities = this.extractEntities(conversationHistory);

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
                issues,
                historyEntities
            }
        };
    }

    extractEntities(history) {
        const entities = {
            flights: [],
            airports: [],
            topics: []
        };

        history.forEach(msg => {
            const flightCodes = msg.content.match(/[A-Z]{2}\d{3,4}/gi) || [];
            entities.flights.push(...flightCodes.map(c => c.toUpperCase()));

            const airports = msg.content.match(/\b[A-Z]{3}\b/g) || [];
            entities.airports.push(...airports);
        });

        return {
            flights: [...new Set(entities.flights)],
            airports: [...new Set(entities.airports)]
        };
    }

    extractFlightFromHistory(history) {
        for (let i = history.length - 1; i >= 0; i--) {
            const match = history[i].content.match(/[A-Z]{2}\d{3,4}/i);
            if (match) return match[0].toUpperCase();
        }
        return null;
    }

    semanticMatch(response, expected) {
        // Simple semantic matching
        const synonyms = {
            'delay': ['trễ', 'chậm', 'muộn', 'delayed'],
            'cancel': ['hủy', 'cancelled', 'đã hủy'],
            'weather': ['thời tiết', 'mưa', 'nắng', 'nhiệt độ'],
            'compensation': ['bồi thường', 'hoàn tiền', 'đền bù']
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
```

### 3.4 Expanded Golden Sets

**Cập nhật file:** `tests/llm/golden-sets/flight-queries.json`

```json
{
    "name": "Flight Queries - Extended",
    "version": "2.0",
    "test_cases": [
        {
            "id": "FQ001",
            "query": "VN123",
            "expected": {
                "should_contain": ["VN123"],
                "should_match_status": "On Time",
                "should_mention": ["SGN", "HAN"],
                "expected_tools": ["search_flight"]
            },
            "priority": "high",
            "category": "basic"
        },
        {
            "id": "FQ002",
            "query": "Tra cứu chuyến VN456",
            "expected": {
                "should_contain": ["VN456"],
                "should_contain_any": ["Delayed", "delay", "trễ", "chậm"],
                "should_mention_delay_minutes": true,
                "expected_tools": ["search_flight"]
            },
            "priority": "high",
            "category": "delayed_flight"
        },
        {
            "id": "FQ003",
            "query": "QH101 có bay không?",
            "expected": {
                "should_contain": ["QH101"],
                "should_contain_any": ["Cancelled", "hủy", "không bay"],
                "expected_tools": ["search_flight"],
                "should_suggest_alternatives": true
            },
            "priority": "high",
            "category": "cancelled_flight"
        },
        {
            "id": "FQ004",
            "query": "INVALID999",
            "expected": {
                "should_contain_any": ["không tìm thấy", "not found", "không có", "không tồn tại"],
                "should_not_hallucinate": true
            },
            "priority": "high",
            "category": "not_found"
        },
        {
            "id": "FQ005",
            "query": "vn123",
            "expected": {
                "should_contain": ["VN123"],
                "description": "Case insensitive flight code"
            },
            "priority": "medium",
            "category": "edge_case"
        },
        {
            "id": "FQ006",
            "query": "Tất cả chuyến bay từ Sài Gòn đi Hà Nội",
            "expected": {
                "should_mention_multiple_flights": true,
                "expected_tools": ["list_flights"],
                "should_contain_any": ["VN123", "QH202", "BL101"]
            },
            "priority": "high",
            "category": "list_query"
        },
        {
            "id": "FQ007",
            "query": "Flight VN123 status please",
            "expected": {
                "should_contain": ["VN123"],
                "language": "english_or_bilingual",
                "expected_tools": ["search_flight"]
            },
            "priority": "medium",
            "category": "language"
        },
        {
            "id": "FQ008",
            "query": "VN456 bị delay bao lâu và tại sao?",
            "expected": {
                "should_contain": ["VN456", "45"],
                "should_contain_any": ["weather", "thời tiết", "Weather conditions"],
                "expected_tools": ["search_flight"]
            },
            "priority": "high",
            "category": "detail_query"
        },
        {
            "id": "FQ009",
            "query": "So sánh VN123 và VJ789",
            "expected": {
                "should_contain": ["VN123", "VJ789"],
                "should_compare_attributes": ["price", "time", "airline"],
                "expected_tools": ["search_flight"]
            },
            "priority": "medium",
            "category": "comparison"
        },
        {
            "id": "FQ010",
            "query": "Chuyến bay rẻ nhất từ SGN đi HAN",
            "expected": {
                "should_mention_price": true,
                "should_suggest_flight": true,
                "expected_tools": ["list_flights"]
            },
            "priority": "medium",
            "category": "recommendation"
        }
    ]
}
```

**Tạo file:** `tests/llm/golden-sets/multi-turn-queries.json`

```json
{
    "name": "Multi-turn Conversation Tests",
    "version": "1.0",
    "test_cases": [
        {
            "id": "MT001",
            "name": "Flight then compensation",
            "turns": [
                {
                    "query": "VN456",
                    "expected": {
                        "should_contain": ["VN456", "Delayed"]
                    }
                },
                {
                    "query": "Tôi được bồi thường không?",
                    "expected": {
                        "should_remember_flight": "VN456",
                        "should_contain_any": ["bồi thường", "compensation"],
                        "expected_tools": ["calculate_compensation"]
                    }
                }
            ],
            "priority": "critical"
        },
        {
            "id": "MT002",
            "name": "Cancelled then alternatives",
            "turns": [
                {
                    "query": "QH101",
                    "expected": {
                        "should_contain": ["QH101", "Cancelled"]
                    }
                },
                {
                    "query": "Có chuyến khác không?",
                    "expected": {
                        "should_remember_route": true,
                        "should_contain_any": ["thay thế", "alternative", "chuyến khác"],
                        "expected_tools": ["find_alternatives"]
                    }
                }
            ],
            "priority": "critical"
        },
        {
            "id": "MT003",
            "name": "Context switch - should not confuse",
            "turns": [
                {
                    "query": "VN123",
                    "expected": {
                        "should_contain": ["VN123"]
                    }
                },
                {
                    "query": "VN456",
                    "expected": {
                        "should_contain": ["VN456"],
                        "should_not_contain": ["VN123 is delayed"],
                        "context_note": "Should not mix up flight info"
                    }
                }
            ],
            "priority": "high"
        },
        {
            "id": "MT004",
            "name": "Weather then flight at same airport",
            "turns": [
                {
                    "query": "Thời tiết ở Đà Nẵng",
                    "expected": {
                        "should_contain_any": ["DAD", "Đà Nẵng"],
                        "expected_tools": ["get_weather"]
                    }
                },
                {
                    "query": "Có chuyến nào đến đó không?",
                    "expected": {
                        "should_remember_airport": "DAD",
                        "expected_tools": ["list_flights"]
                    }
                }
            ],
            "priority": "high"
        },
        {
            "id": "MT005",
            "name": "Three-turn deep context",
            "turns": [
                {
                    "query": "VN456 bị delay đúng không?",
                    "expected": {
                        "should_contain": ["VN456", "delay"]
                    }
                },
                {
                    "query": "Delay bao lâu?",
                    "expected": {
                        "should_contain": ["45"],
                        "should_remember_flight": "VN456"
                    }
                },
                {
                    "query": "Vé 2 triệu thì được hoàn bao nhiêu?",
                    "expected": {
                        "should_remember_delay": true,
                        "should_calculate": true,
                        "expected_tools": ["calculate_compensation"]
                    }
                }
            ],
            "priority": "critical"
        }
    ]
}
```

### 3.5 Multi-turn Test Runner

**Tạo file:** `tests/llm/behavioral/multi-turn.test.js`

```javascript
const { api } = require('../../utils/api-client');
const { ContextRetentionEvaluator } = require('../evaluators/context-evaluator');
const multiTurnQueries = require('../golden-sets/multi-turn-queries.json');

describe('Multi-turn Conversations', () => {
    const contextEvaluator = new ContextRetentionEvaluator();
    const TIMEOUT = 60000;

    multiTurnQueries.test_cases.forEach(testCase => {
        test(`${testCase.id}: ${testCase.name}`, async () => {
            const history = [];
            let lastResponse = '';

            for (let i = 0; i < testCase.turns.length; i++) {
                const turn = testCase.turns[i];

                const res = await api.post('/api/chat', {
                    message: turn.query,
                    history: history
                }, { timeout: TIMEOUT });

                expect(res.status).toBe(200);
                const response = res.body.response;
                lastResponse = response;

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
```

---

## 4. Advanced MCP Testing Improvements

### 4.1 MCP Tool Integration Tests

**Tạo file:** `tests/integration/mcp-integration.test.js`

```javascript
const { api } = require('../utils/api-client');
const { resetTestDatabase, closePool, getPool } = require('../utils/db-setup');

describe('MCP Integration Tests', () => {
    beforeAll(async () => {
        await resetTestDatabase();
    });

    afterAll(async () => {
        await closePool();
    });

    describe('Tool Chaining', () => {
        test('search_flight → calculate_compensation flow', async () => {
            // Step 1: Search delayed flight
            const flightRes = await api.post('/api/mcp/search_flight', {
                flight_code: 'VN456'
            });

            expect(flightRes.status).toBe(200);
            const flight = flightRes.body.result;
            expect(flight.status).toBe('Delayed');
            expect(flight.delay_minutes).toBe(45);

            // Step 2: Calculate compensation with flight data
            const compRes = await api.post('/api/mcp/calculate_compensation', {
                delay_minutes: flight.delay_minutes,
                ticket_price: flight.price
            });

            expect(compRes.status).toBe(200);
            // 45 minutes delay = no compensation (< 60 min)
            expect(compRes.body.result.eligible).toBe(false);
        });

        test('search_flight → find_alternatives flow for cancelled', async () => {
            // Step 1: Search cancelled flight
            const flightRes = await api.post('/api/mcp/search_flight', {
                flight_code: 'QH101'
            });

            expect(flightRes.status).toBe(200);
            const flight = flightRes.body.result;
            expect(flight.status).toBe('Cancelled');

            // Step 2: Find alternatives for same route
            const altRes = await api.post('/api/mcp/find_alternatives', {
                from_airport: flight.from_airport,
                to_airport: flight.to_airport
            });

            expect(altRes.status).toBe(200);
            expect(Array.isArray(altRes.body.result.alternatives)).toBe(true);

            // Should not include cancelled flights
            const alternatives = altRes.body.result.alternatives;
            alternatives.forEach(alt => {
                expect(alt.status).not.toBe('Cancelled');
            });
        });

        test('get_weather → relevant for flight destination', async () => {
            // Get flight
            const flightRes = await api.post('/api/mcp/search_flight', {
                flight_code: 'VN123'
            });

            const destAirport = flightRes.body.result.to_airport;

            // Get weather at destination
            const weatherRes = await api.post('/api/mcp/get_weather', {
                airport_code: destAirport
            });

            expect(weatherRes.status).toBe(200);
            expect(weatherRes.body.result.airport_code).toBe(destAirport);
        });
    });

    describe('Error Propagation', () => {
        test('should return 404 for non-existent flight', async () => {
            const res = await api.post('/api/mcp/search_flight', {
                flight_code: 'INVALID999'
            });

            expect(res.status).toBe(404);
            expect(res.body.error).toMatch(/not found/i);
        });

        test('should return 400 for missing required params', async () => {
            const res = await api.post('/api/mcp/search_flight', {});

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/missing/i);
        });

        test('should return 400 for invalid compensation params', async () => {
            const res = await api.post('/api/mcp/calculate_compensation', {
                delay_minutes: -10,
                ticket_price: 1000000
            });

            expect(res.status).toBe(400);
        });

        test('should handle concurrent tool calls', async () => {
            const calls = [
                api.post('/api/mcp/search_flight', { flight_code: 'VN123' }),
                api.post('/api/mcp/search_flight', { flight_code: 'VN456' }),
                api.post('/api/mcp/get_weather', { airport_code: 'SGN' }),
                api.post('/api/mcp/get_weather', { airport_code: 'HAN' })
            ];

            const results = await Promise.all(calls);

            results.forEach(res => {
                expect(res.status).toBe(200);
            });
        });
    });

    describe('Data Consistency', () => {
        test('flight price should match database', async () => {
            const pool = getPool();
            const dbResult = await pool.query(
                'SELECT price FROM flights WHERE flight_code = $1',
                ['VN123']
            );

            const apiRes = await api.post('/api/mcp/search_flight', {
                flight_code: 'VN123'
            });

            expect(apiRes.body.result.price).toBe(dbResult.rows[0].price);
        });

        test('compensation calculation should be deterministic', async () => {
            const params = { delay_minutes: 180, ticket_price: 2000000 };

            const results = await Promise.all([
                api.post('/api/mcp/calculate_compensation', params),
                api.post('/api/mcp/calculate_compensation', params),
                api.post('/api/mcp/calculate_compensation', params)
            ]);

            const amounts = results.map(r => r.body.result.compensation_amount);
            expect(new Set(amounts).size).toBe(1); // All same
        });
    });
});
```

### 4.2 MCP Tool Boundary Tests

**Tạo file:** `tests/api/mcp-boundary.test.js`

```javascript
const { api } = require('./setup');

describe('MCP Tool Boundary Tests', () => {

    describe('search_flight boundaries', () => {
        test.each([
            ['VN123', 200, 'valid uppercase'],
            ['vn123', 200, 'valid lowercase'],
            ['Vn123', 200, 'valid mixed case'],
            ['VN1234', 404, 'valid format but not exists'],
            ['ABC', 404, 'too short'],
            ['VNABC', 404, 'invalid format'],
            ['', 400, 'empty string'],
            ['VN123; DROP TABLE flights;--', 404, 'SQL injection attempt'],
        ])('flight_code: %s should return %d (%s)', async (code, expectedStatus, desc) => {
            const res = await api.post('/api/mcp/search_flight', {
                flight_code: code
            });
            expect(res.status).toBe(expectedStatus);
        });
    });

    describe('get_weather boundaries', () => {
        test.each([
            ['SGN', 200, 'valid code'],
            ['sgn', 200, 'lowercase'],
            ['XYZ', 404, 'invalid code'],
            ['', 400, 'empty'],
            ['SGNN', 404, 'too long'],
        ])('airport_code: %s should return %d (%s)', async (code, expectedStatus, desc) => {
            const res = await api.post('/api/mcp/get_weather', {
                airport_code: code
            });
            expect(res.status).toBe(expectedStatus);
        });
    });

    describe('calculate_compensation boundaries', () => {
        test.each([
            // [delay_minutes, ticket_price, eligible, rate_desc]
            [0, 1000000, false, 'no delay'],
            [59, 1000000, false, 'under 1h'],
            [60, 1000000, true, 'exactly 1h - 15%'],
            [119, 1000000, true, '1h59m - 15%'],
            [120, 1000000, true, 'exactly 2h - 30%'],
            [179, 1000000, true, '2h59m - 30%'],
            [180, 1000000, true, 'exactly 3h - 50%'],
            [240, 1000000, true, '4h - 50%'],
            [999, 1000000, true, 'cancelled marker'],
        ])('delay=%d, price=%d -> eligible=%s (%s)', async (delay, price, eligible, desc) => {
            const res = await api.post('/api/mcp/calculate_compensation', {
                delay_minutes: delay,
                ticket_price: price
            });

            expect(res.status).toBe(200);
            expect(res.body.result.eligible).toBe(eligible);
        });

        test('compensation proportional to price', async () => {
            const delay = 180; // 50% rate

            const res1 = await api.post('/api/mcp/calculate_compensation', {
                delay_minutes: delay,
                ticket_price: 1000000
            });

            const res2 = await api.post('/api/mcp/calculate_compensation', {
                delay_minutes: delay,
                ticket_price: 2000000
            });

            expect(res2.body.result.compensation_amount)
                .toBe(res1.body.result.compensation_amount * 2);
        });
    });

    describe('find_alternatives boundaries', () => {
        test('returns non-cancelled flights only', async () => {
            const res = await api.post('/api/mcp/find_alternatives', {
                from_airport: 'HAN',
                to_airport: 'SGN'
            });

            expect(res.status).toBe(200);
            res.body.result.alternatives.forEach(flight => {
                expect(flight.status).not.toBe('Cancelled');
            });
        });

        test('returns empty for invalid route', async () => {
            const res = await api.post('/api/mcp/find_alternatives', {
                from_airport: 'PQC',
                to_airport: 'VDO'  // No direct flights
            });

            expect(res.status).toBe(200);
            expect(res.body.result.alternatives).toHaveLength(0);
        });
    });
});
```

---

## 5. Advanced A2A Testing Improvements

### 5.1 A2A Flow Logging Test

**Cập nhật file:** `server/index.js` - Thêm tools_used tracking

```javascript
// Add to line ~395, before final res.json()
// Track which tools were used
const toolsUsed = [];
// In the while loop, after each tool call:
toolsUsed.push(toolName);

// Update response at line ~420-426:
res.json({
    success: true,
    response: assistantMessage.content,
    logs,
    usage: response.usage,
    tools_used: toolsUsed  // ADD THIS
});
```

### 5.2 A2A Agent Coordination Test

**Tạo file:** `tests/integration/a2a-coordination.test.js`

```javascript
const { api } = require('../utils/api-client');

describe('A2A Agent Coordination', () => {
    const TIMEOUT = 60000;

    describe('Agent Delegation Patterns', () => {
        test('flight query delegates to flight agent', async () => {
            const res = await api.post('/api/chat', {
                message: 'VN123',
                history: []
            }, { timeout: TIMEOUT });

            expect(res.status).toBe(200);

            // Check logs for delegation
            const logs = res.body.logs;
            const delegations = logs.filter(l => l.type === 'a2a');

            expect(delegations.length).toBeGreaterThan(0);
            expect(delegations.some(d => d.details.includes('flight'))).toBe(true);
        });

        test('weather query delegates to weather agent', async () => {
            const res = await api.post('/api/chat', {
                message: 'Thời tiết sân bay SGN',
                history: []
            }, { timeout: TIMEOUT });

            expect(res.status).toBe(200);

            const logs = res.body.logs;
            const delegations = logs.filter(l => l.type === 'a2a');

            expect(delegations.some(d => d.details.includes('weather'))).toBe(true);
        });

        test('compensation query delegates to support agent', async () => {
            const res = await api.post('/api/chat', {
                message: 'Delay 3 tiếng, vé 2 triệu, bồi thường?',
                history: []
            }, { timeout: TIMEOUT });

            expect(res.status).toBe(200);

            const logs = res.body.logs;
            const delegations = logs.filter(l => l.type === 'a2a');

            expect(delegations.some(d => d.details.includes('support'))).toBe(true);
        });

        test('complex query coordinates multiple agents', async () => {
            const res = await api.post('/api/chat', {
                message: 'QH101 bị hủy, tìm chuyến thay thế và tính bồi thường',
                history: []
            }, { timeout: TIMEOUT });

            expect(res.status).toBe(200);

            const logs = res.body.logs;
            const agents = new Set(logs.filter(l => l.type === 'a2a').map(l => l.agent));

            // Should involve multiple agents
            expect(agents.size).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Tool Chain Verification', () => {
        test('tools_used is populated correctly', async () => {
            const res = await api.post('/api/chat', {
                message: 'VN456 bị delay, tính bồi thường với vé 2 triệu',
                history: []
            }, { timeout: TIMEOUT });

            expect(res.status).toBe(200);

            const toolsUsed = res.body.tools_used || [];

            // Should have used both search_flight and calculate_compensation
            expect(toolsUsed).toContain('search_flight');
            expect(toolsUsed).toContain('calculate_compensation');
        });
    });

    describe('Log Completeness', () => {
        test('logs show full request lifecycle', async () => {
            const res = await api.post('/api/chat', {
                message: 'VN123',
                history: []
            }, { timeout: TIMEOUT });

            const logs = res.body.logs;

            // Check lifecycle stages
            const stages = logs.map(l => l.type);

            expect(stages).toContain('request');  // Initial request
            expect(stages).toContain('llm');      // LLM processing
            expect(stages).toContain('mcp');      // MCP tool execution
            expect(stages).toContain('complete'); // Completion
        });
    });
});
```

---

## 6. Implementation Tasks

### Task List cho Antigravity Agent

```
□ Task 1: Fix Server - Add tools_used tracking
  File: server/index.js
  Action: Add tools_used array to response
  Priority: CRITICAL

□ Task 2: Create LLM Judge Evaluator
  File: tests/llm/evaluators/llm-judge-evaluator.js
  Priority: HIGH

□ Task 3: Create Hallucination Evaluator
  File: tests/llm/evaluators/hallucination-evaluator.js
  Priority: HIGH

□ Task 4: Create Context Retention Evaluator
  File: tests/llm/evaluators/context-evaluator.js
  Priority: HIGH

□ Task 5: Update Golden Sets
  File: tests/llm/golden-sets/flight-queries.json
  Action: Expand test cases
  Priority: HIGH

□ Task 6: Create Multi-turn Golden Set
  File: tests/llm/golden-sets/multi-turn-queries.json
  Priority: CRITICAL

□ Task 7: Create Multi-turn Tests
  File: tests/llm/behavioral/multi-turn.test.js
  Priority: CRITICAL

□ Task 8: Create MCP Integration Tests
  File: tests/integration/mcp-integration.test.js
  Priority: HIGH

□ Task 9: Create MCP Boundary Tests
  File: tests/api/mcp-boundary.test.js
  Priority: MEDIUM

□ Task 10: Create A2A Coordination Tests
  File: tests/integration/a2a-coordination.test.js
  Priority: HIGH

□ Task 11: Fix Compensation Logic Inconsistency
  File: tests/utils/test-helpers.js
  Action: Align with server logic (30% for 2-3h)
  Priority: MEDIUM

□ Task 12: Add Missing MCP Tool Tests
  File: tests/api/mcp-tools.test.js
  Action: Add list_flights, get_airport_info tests
  Priority: MEDIUM

□ Task 13: Add E2E Error State Tests
  File: tests/e2e/error-states.spec.ts
  Priority: MEDIUM

□ Task 14: Update npm scripts
  File: package.json
  Action: Add test:multi-turn, test:mcp scripts
  Priority: LOW
```

### Antigravity Prompt Template

```
Prompt cho Antigravity:

"Thực hiện các tasks theo thứ tự ưu tiên sau:

1. CRITICAL FIRST:
   - Task 1: Fix server/index.js - thêm tools_used tracking
   - Task 6: Tạo multi-turn-queries.json
   - Task 7: Tạo multi-turn.test.js

2. HIGH PRIORITY:
   - Tasks 2, 3, 4: Tạo các evaluators mới
   - Task 5: Update flight-queries.json
   - Task 8: Tạo mcp-integration.test.js
   - Task 10: Tạo a2a-coordination.test.js

3. MEDIUM PRIORITY:
   - Tasks 9, 11, 12, 13

4. LOW PRIORITY:
   - Task 14: Update package.json

Sau mỗi task:
- Verify file được tạo đúng path
- Chạy test nếu có thể
- Commit với message: 'test: [task description]'

Source code location: flight-checker-main/
Test location: flight-checker-main/tests/"
```

---

## 7. Best Practices Checklist

### AI System Testing Best Practices

- [ ] **Non-deterministic Testing**: Sử dụng pattern matching thay vì exact match
- [ ] **Evaluator Scores**: Threshold ≥ 0.7 cho relevance, ≥ 0.8 cho safety
- [ ] **Golden Sets**: Ít nhất 10 test cases per category
- [ ] **Multi-turn**: Test context retention qua ≥ 3 turns
- [ ] **Hallucination Detection**: Verify against known data
- [ ] **Tool Selection**: Track actual tools used vs expected
- [ ] **Consistency**: Run same query multiple times
- [ ] **Adversarial**: Test prompt injection resistance
- [ ] **LLM-as-Judge**: Use for subjective quality assessment

### Code Quality Checklist

- [ ] Timeout 60s cho tất cả LLM calls
- [ ] Error handling cho OpenAI API failures
- [ ] Test isolation với resetTestDatabase()
- [ ] Retry logic cho flaky tests
- [ ] Page Object Model cho E2E
- [ ] Fixtures cho test data
- [ ] Environment variables cho secrets

### Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| API Endpoints | 70% | 95% |
| MCP Tools | 60% | 90% |
| LLM Behavioral | 50% | 85% |
| Multi-turn | 20% | 80% |
| E2E Flows | 40% | 75% |
| Error Cases | 30% | 70% |

---

## Appendix: File Paths Summary

```
NEW FILES TO CREATE:
├── tests/llm/evaluators/llm-judge-evaluator.js
├── tests/llm/evaluators/hallucination-evaluator.js
├── tests/llm/evaluators/context-evaluator.js
├── tests/llm/golden-sets/multi-turn-queries.json
├── tests/llm/behavioral/multi-turn.test.js
├── tests/integration/mcp-integration.test.js
├── tests/integration/a2a-coordination.test.js
├── tests/api/mcp-boundary.test.js
└── tests/e2e/error-states.spec.ts

FILES TO UPDATE:
├── server/index.js (add tools_used)
├── tests/llm/golden-sets/flight-queries.json (expand)
├── tests/utils/test-helpers.js (fix compensation logic)
├── tests/api/mcp-tools.test.js (add missing tools)
└── package.json (add new scripts)
```

---

**Document Version:** 1.0  
**Created for:** Antigravity Agent  
**Project:** Flight Checker AI  
**Next Review:** After implementation
