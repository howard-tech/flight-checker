# AGENT.md - Flight Checker AI Project

## 🎯 Project Overview

**Flight Checker** là một AI-powered flight assistant application sử dụng:
- **LLM**: OpenAI GPT để xử lý natural language queries
- **MCP**: Model Context Protocol để gọi các tools (search_flight, get_weather, etc.)
- **A2A**: Agent-to-Agent communication cho complex workflows
- **Stack**: React + Vite (frontend), Express.js (backend), PostgreSQL (database)

---

## 📁 Project Structure

```
flight-checker/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API services
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Express.js server
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── mcp/              # MCP tool handlers
│   │   ├── agents/           # A2A agents
│   │   └── db/               # Database queries
│   ├── package.json
│   └── server.js
│
├── database/                 # PostgreSQL scripts
│   ├── init.sql              # Schema & seed data
│   └── migrations/
│
├── tests/                    # Test automation
│   ├── __config__/           # Jest & Playwright configs
│   ├── api/                  # API tests
│   ├── llm/                  # LLM behavioral tests
│   ├── e2e/                  # End-to-end tests
│   ├── integration/          # Integration tests
│   ├── fixtures/             # Test data
│   └── utils/                # Test utilities
│
├── docker-compose.yml        # Container orchestration
├── .env.example              # Environment template
├── package.json              # Root package.json
└── README.md
```

---

## 🔧 Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | React | 18.x | UI components |
| Frontend | Vite | 5.x | Build tool |
| Frontend | TailwindCSS | 3.x | Styling |
| Backend | Express.js | 4.x | API server |
| Backend | OpenAI SDK | 4.x | LLM integration |
| Database | PostgreSQL | 16.x | Data storage |
| Testing | Jest | 29.x | Unit/API tests |
| Testing | Playwright | 1.x | E2E tests |
| Container | Docker | 24.x | Containerization |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (hoặc dùng Docker)
- OpenAI API Key

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/howard-tech/flight-checker.git
cd flight-checker

# 2. Copy environment file
cp .env.example .env
# Edit .env và thêm OPENAI_API_KEY

# 3. Start với Docker
docker-compose up -d

# 4. Hoặc start thủ công
# Terminal 1: Database
docker-compose up postgres -d

# Terminal 2: Backend
cd backend && npm install && npm run dev

# Terminal 3: Frontend
cd frontend && npm install && npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

---

## 📡 API Endpoints

### Health Check
```
GET /api/health
Response: { status: "ok", database: "connected", timestamp: "..." }
```

### Chat (Main AI Endpoint)
```
POST /api/chat
Body: { message: string, history: Array<{role, content}> }
Response: { response: string, tools_used: string[], agent: string }
```

### Flights
```
GET /api/flights                    # List all flights
GET /api/flights/:code              # Get flight by code
GET /api/flights?from=SGN&to=HAN    # Filter flights
```

### Airports
```
GET /api/airports                   # List all airports
GET /api/airports/:code             # Get airport by code
```

### Weather
```
GET /api/weather                    # All airport weather
GET /api/weather/:airport_code      # Weather for specific airport
```

### MCP Tools
```
POST /api/mcp/search_flight         # { flight_code: "VN123" }
POST /api/mcp/get_weather           # { airport_code: "SGN" }
POST /api/mcp/find_alternatives     # { from_airport, to_airport }
POST /api/mcp/calculate_compensation # { delay_minutes, ticket_price }
```

---

## 🗄️ Database Schema

### Tables

```sql
-- Airports
CREATE TABLE airports (
    airport_code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) DEFAULT 'Vietnam',
    lounges TEXT[]
);

-- Flights
CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    flight_code VARCHAR(10) UNIQUE NOT NULL,
    airline VARCHAR(50) NOT NULL,
    from_airport VARCHAR(3) REFERENCES airports(airport_code),
    to_airport VARCHAR(3) REFERENCES airports(airport_code),
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'On Time',
    gate VARCHAR(10),
    terminal VARCHAR(5),
    aircraft VARCHAR(20),
    price INTEGER,
    delay_minutes INTEGER DEFAULT 0,
    delay_reason TEXT
);

-- Weather
CREATE TABLE weather (
    id SERIAL PRIMARY KEY,
    airport_code VARCHAR(3) UNIQUE REFERENCES airports(airport_code),
    temperature INTEGER NOT NULL,
    condition VARCHAR(50) NOT NULL,
    humidity INTEGER,
    wind_speed VARCHAR(20),
    visibility VARCHAR(20) DEFAULT 'Good'
);
```

### Test Data

| Flight Code | Airline | Route | Status | Delay |
|-------------|---------|-------|--------|-------|
| VN123 | Vietnam Airlines | SGN → HAN | On Time | 0 |
| VN456 | Vietnam Airlines | SGN → DAD | Delayed | 45 min |
| QH101 | Bamboo Airways | HAN → PQC | Cancelled | - |
| VJ201 | VietJet Air | DAD → SGN | On Time | 0 |

| Airport | City | Weather |
|---------|------|---------|
| SGN | Ho Chi Minh | 32°C, Sunny |
| HAN | Hanoi | 28°C, Cloudy |
| DAD | Da Nang | 30°C, Partly Cloudy |
| PQC | Phu Quoc | 31°C, Clear |

---

## 🤖 MCP Tools

### search_flight
Tìm kiếm thông tin chuyến bay theo mã.

```javascript
// Input
{ flight_code: "VN456" }

// Output
{
  tool: "search_flight",
  result: {
    flight_code: "VN456",
    airline: "Vietnam Airlines",
    from_airport: "SGN",
    to_airport: "DAD",
    status: "Delayed",
    delay_minutes: 45,
    delay_reason: "Weather conditions"
  }
}
```

### get_weather
Lấy thông tin thời tiết tại sân bay.

```javascript
// Input
{ airport_code: "SGN" }

// Output
{
  tool: "get_weather",
  result: {
    airport_code: "SGN",
    temperature: 32,
    condition: "Sunny",
    humidity: 75,
    wind_speed: "10 km/h"
  }
}
```

### find_alternatives
Tìm chuyến bay thay thế.

```javascript
// Input
{ from_airport: "SGN", to_airport: "HAN" }

// Output
{
  tool: "find_alternatives",
  result: {
    alternatives: [
      { flight_code: "VN123", departure: "08:00", status: "On Time" },
      { flight_code: "VJ305", departure: "14:30", status: "On Time" }
    ]
  }
}
```

### calculate_compensation
Tính tiền bồi thường cho chuyến bay bị delay.

```javascript
// Input
{ delay_minutes: 180, ticket_price: 2000000 }

// Output
{
  tool: "calculate_compensation",
  result: {
    eligible: true,
    compensation_amount: 1000000,
    reason: "Delay > 3 hours"
  }
}
```

**Compensation Rules:**
- Delay < 2 hours: Không bồi thường
- Delay 2-3 hours: 30% giá vé
- Delay > 3 hours: 50% giá vé

---

## 🧪 Testing

### Test Structure

```
tests/
├── __config__/
│   ├── jest.config.js          # Jest configuration
│   ├── jest.setup.js           # Jest setup
│   ├── playwright.config.ts    # Playwright configuration
│   └── .env.test               # Test environment
│
├── api/                        # API Tests
│   ├── setup.js
│   ├── health.test.js
│   ├── flights.test.js
│   ├── chat.test.js
│   └── mcp-tools.test.js
│
├── llm/                        # LLM Behavioral Tests
│   ├── evaluators/
│   │   ├── relevance-evaluator.js
│   │   ├── tool-selection-evaluator.js
│   │   └── safety-evaluator.js
│   ├── golden-sets/
│   │   ├── flight-queries.json
│   │   └── compensation-queries.json
│   ├── behavioral/
│   │   ├── response-quality.test.js
│   │   └── consistency.test.js
│   └── adversarial/
│       ├── prompt-injection.test.js
│       └── edge-cases.test.js
│
├── e2e/                        # End-to-End Tests
│   ├── pages/
│   │   └── ChatPage.ts
│   ├── flight-search.spec.ts
│   └── chat-conversation.spec.ts
│
└── fixtures/                   # Test Data
    ├── flights.json
    └── airports.json
```

### Running Tests

```bash
# All tests
npm test

# Specific test suites
npm run test:api          # API tests only
npm run test:llm          # LLM behavioral tests
npm run test:e2e          # E2E tests (requires running app)
npm run test:integration  # Integration tests

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### LLM Testing Approach

**Vì LLM responses không deterministic, sử dụng:**

1. **Pattern Matching** thay vì exact match
```javascript
expect(response).toMatch(/VN456/i);
expect(response.toLowerCase()).toMatch(/delay|trễ|chậm/);
```

2. **Evaluators với Scoring**
```javascript
const relevanceScore = await relevanceEvaluator.evaluate(query, response);
expect(relevanceScore).toBeGreaterThanOrEqual(0.7);
```

3. **Golden Test Sets** - Pre-verified Q&A pairs
4. **Consistency Tests** - Same query multiple times
5. **Safety Tests** - Prompt injection resistance

---

## 🔒 Environment Variables

```env
# Backend
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flight_db

# OpenAI
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Frontend
VITE_API_URL=http://localhost:3001

# Testing
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
```

---

## 📋 Coding Conventions

### JavaScript/TypeScript
- Use ES6+ syntax
- Async/await for promises
- Destructuring where appropriate
- Meaningful variable names in English
- Comments có thể viết tiếng Việt cho business logic

### File Naming
- Components: `PascalCase.jsx` (e.g., `ChatMessage.jsx`)
- Utilities: `kebab-case.js` (e.g., `api-client.js`)
- Tests: `*.test.js` hoặc `*.spec.ts`
- Constants: `SCREAMING_SNAKE_CASE`

### API Response Format
```javascript
// Success
{
  data: { ... },
  message: "Success"
}

// Error
{
  error: "Error message",
  code: "ERROR_CODE"
}
```

### Commit Messages
```
feat: Add flight search feature
fix: Fix compensation calculation bug
test: Add LLM behavioral tests
docs: Update API documentation
refactor: Refactor MCP handlers
```

---

## 🚨 Common Issues & Solutions

### Issue: LLM Response Timeout
```javascript
// Solution: Increase timeout for LLM calls
const TIMEOUT = 60000; // 60 seconds
await api.post('/api/chat', body, { timeout: TIMEOUT });
```

### Issue: Database Connection Failed
```bash
# Solution: Check PostgreSQL is running
docker-compose ps
docker-compose up postgres -d
```

### Issue: OpenAI Rate Limiting
```javascript
// Solution: Add retry logic với exponential backoff
const response = await retryWithBackoff(() => openai.chat.completions.create(...));
```

### Issue: E2E Tests Flaky
```typescript
// Solution: Wait for specific elements instead of fixed delays
await page.waitForSelector('.message-assistant');
await chatPage.waitForResponse(30000);
```

---

## 🔄 Development Workflow

### Adding New MCP Tool

1. **Define tool schema** trong `backend/src/mcp/tools.js`
```javascript
const newTool = {
  name: "tool_name",
  description: "Tool description",
  parameters: {
    type: "object",
    properties: { ... },
    required: [...]
  }
};
```

2. **Implement handler** trong `backend/src/mcp/handlers/`
```javascript
async function handleToolName(params) {
  // Implementation
  return { result: ... };
}
```

3. **Register tool** trong MCP server

4. **Add tests**
```javascript
// tests/api/mcp-tools.test.js
describe('POST /api/mcp/tool_name', () => {
  test('returns expected result', async () => {
    const res = await api.post('/api/mcp/tool_name', { ... });
    expect(res.status).toBe(200);
  });
});
```

### Adding New API Endpoint

1. Create route trong `backend/src/routes/`
2. Create controller trong `backend/src/controllers/`
3. Add tests trong `tests/api/`
4. Update API documentation

### Adding E2E Test

1. Create/update Page Object trong `tests/e2e/pages/`
2. Create spec file trong `tests/e2e/`
3. Use meaningful test descriptions

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `backend/src/server.js` | Express server entry point |
| `backend/src/routes/chat.js` | Chat API route |
| `backend/src/mcp/index.js` | MCP tools orchestration |
| `frontend/src/App.jsx` | Main React component |
| `frontend/src/components/Chat.jsx` | Chat interface |
| `database/init.sql` | Database schema & seed |
| `tests/__config__/jest.config.js` | Jest configuration |
| `docker-compose.yml` | Container setup |

---

## 🎯 Agent Task Examples

### Task: "Add weather alert feature"
1. Thêm field `alert` vào weather table
2. Tạo endpoint `GET /api/weather/:code/alerts`
3. Tạo MCP tool `check_weather_alert`
4. Update frontend để hiển thị alerts
5. Add tests cho tất cả changes

### Task: "Improve chat response quality"
1. Review current prompts trong `backend/src/services/chat.js`
2. Add more context về Vietnamese flight regulations
3. Implement response caching cho common queries
4. Add LLM evaluation tests

### Task: "Fix bug: Compensation calculation incorrect"
1. Check `calculate_compensation` handler
2. Verify business rules (2h, 3h thresholds)
3. Add/fix unit tests
4. Test với various delay scenarios

---

## 📞 Support

- **Documentation**: Xem README.md và các file trong `/docs`
- **Test Reference**: Xem `tests/` folder structure
- **API Reference**: Xem section API Endpoints ở trên
- **Database Schema**: Xem `database/init.sql`

---

## ⚠️ Important Notes for AI Agents

1. **Always run tests** sau khi thay đổi code
2. **LLM tests cần timeout dài** (60s+)
3. **Không hardcode** API keys hoặc secrets
4. **Vietnamese comments OK** cho business logic
5. **Check database connection** trước khi run tests
6. **Use fixtures** cho test data thay vì hardcoded values
7. **Pattern matching** cho LLM response validation
8. **Retry logic** cho external API calls

---

*Last updated: December 2024*
