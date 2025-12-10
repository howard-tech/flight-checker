# Flight Checker Test Automation

Test automation suite for the Flight Checker AI project using Jest, Playwright, and PostgreSQL.

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Flight Checker running on localhost:3001 (backend) and localhost:5173 (frontend)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run API tests
npm run test:api

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
flight-checker-tests/
├── api/                    # API tests (Jest + Supertest)
│   ├── setup.js           # API client setup
│   ├── health.test.js     # Health check tests
│   ├── flights.test.js    # Flights API tests
│   ├── airports.test.js   # Airports API tests
│   ├── chat.test.js       # Chat API tests
│   └── mcp-tools.test.js  # MCP tools tests
├── e2e/                    # E2E tests (Playwright)
│   ├── flight-search.spec.ts
│   └── weather-query.spec.ts
├── integration/            # Integration tests
│   └── db-connection.test.js
├── fixtures/               # Test data
│   ├── flights.json
│   └── airports.json
├── utils/                  # Test helpers
│   └── test-helpers.js
├── jest.config.js
├── playwright.config.ts
├── .env.test
└── package.json
```

## 🧪 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all Jest tests |
| `npm run test:api` | Run API tests only |
| `npm run test:integration` | Run integration tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:headed` | Run E2E with browser visible |
| `npm run test:e2e:debug` | Debug E2E tests |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:coverage` | Run with coverage report |
| `npm run test:watch` | Watch mode for development |
| `npm run report` | Open Playwright HTML report |

## 📊 Test Data

### Flight Codes

| Code | Status | Use Case |
|------|--------|----------|
| VN123 | On Time | Happy path |
| VN456 | Delayed | Delay handling |
| QH101 | Cancelled | Error handling |
| VJ201 | On Time | Alternative airline |

### Airport Codes

| Code | City | Airport |
|------|------|---------|
| SGN | Ho Chi Minh | Tan Son Nhat |
| HAN | Hanoi | Noi Bai |
| DAD | Da Nang | Da Nang International |
| PQC | Phu Quoc | Phu Quoc International |

## 🔧 Configuration

### Environment Variables (.env.test)

```env
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flight_db
OPENAI_API_KEY=sk-test-mock-key
```

---

# 🛠️ Workflow: Claude Desktop + Antigravity Desktop

## Step 1: Setup Environment

### 1.1 Ensure Flight Checker is Running

```bash
cd flight-checker
docker-compose up -d

# Verify
curl http://localhost:3001/api/health
```

### 1.2 Copy Test Project

Copy thư mục `flight-checker-tests/` vào trong project `flight-checker/tests/`

```bash
cp -r flight-checker-tests flight-checker/tests
cd flight-checker/tests
npm install
```

## Step 2: Claude Desktop Team Configuration

### 2.1 Create New Project

1. Mở **Claude Desktop**
2. Click **New Project** → Đặt tên: `Flight Checker Test Automation`

### 2.2 Add Project Instructions

```markdown
Bạn là chuyên gia Test Automation cho dự án Flight Checker AI.

**Project Stack:**
- Frontend: React + Vite (port 5173)
- Backend: Express.js + OpenAI (port 3001)  
- Database: PostgreSQL
- Features: MCP Tools, A2A Agents

**Test Frameworks:**
- API Testing: Jest + Supertest
- E2E Testing: Playwright
- Database: pg client

**Test Data:**
- VN123: On Time flight
- VN456: Delayed flight (45 min)
- QH101: Cancelled flight
- Airports: SGN, HAN, DAD, PQC

**Khi viết test:**
1. Follow AAA pattern (Arrange-Act-Assert)
2. Use async/await consistently
3. Set appropriate timeouts (30s for API, 60s for E2E)
4. Mock OpenAI to avoid costs
5. Use fixtures from fixtures/*.json
```

### 2.3 Upload Knowledge Files (Optional)

Upload các file sau vào Project Knowledge:
- `fixtures/flights.json`
- `fixtures/airports.json`
- Test patterns documentation

## Step 3: Antigravity Desktop Workflow

### 3.1 Open Project

1. Mở **Antigravity Desktop**
2. Open folder: `flight-checker/tests`

### 3.2 AI-Assisted Test Development

#### Scenario A: Tạo test mới

```
Prompt trong Antigravity:
"Tạo API test cho endpoint POST /api/mcp/search_flight 
với các test cases:
- Valid flight code VN123
- Invalid flight code UNKNOWN999
- Missing flight_code parameter"
```

#### Scenario B: Debug failing test

```
Prompt trong Antigravity:
"Test 'should return delay info for VN456' đang fail 
với error 'Expected Delayed but received On Time'.
Giúp tôi debug và fix."
```

#### Scenario C: Improve test coverage

```
Prompt trong Antigravity:
"Analyze test coverage và suggest thêm test cases 
cho chat.test.js để đạt 90% coverage"
```

### 3.3 Run Tests trong Antigravity Terminal

```bash
# Terminal trong Antigravity
npm run test:api
npm run test:e2e:headed
```

## Step 4: Collaboration Workflow

### 4.1 Planning (Claude Desktop)

Sử dụng Claude Desktop cho:
- Design test strategy
- Review test coverage
- Discuss edge cases
- Generate test scenarios

**Example Prompt:**
```
"Phân tích API /api/chat và đề xuất 20 test cases 
covering: happy path, error handling, edge cases, 
performance, security"
```

### 4.2 Implementation (Antigravity)

Sử dụng Antigravity cho:
- Write actual test code
- Debug tests
- Refactor tests
- Run tests locally

**Example Prompt:**
```
"Implement các test cases sau trong file chat.test.js:
1. Test multi-turn conversation với 5 turns
2. Test rate limiting
3. Test concurrent requests"
```

### 4.3 Review (Both Tools)

- **Claude Desktop**: High-level review, suggest improvements
- **Antigravity**: Code-level fixes, refactoring

## Step 5: CI/CD Integration

### 5.1 GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Test Automation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: flight_db
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd tests
          npm ci
      
      - name: Run API tests
        run: |
          cd tests
          npm run test:api
        env:
          API_BASE_URL: http://localhost:3001

  e2e-tests:
    runs-on: ubuntu-latest
    needs: api-tests
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Install Playwright
        run: |
          cd tests
          npm ci
          npx playwright install --with-deps chromium
      
      - name: Start app
        run: docker-compose up -d
      
      - name: Run E2E tests
        run: |
          cd tests
          npm run test:e2e
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: tests/playwright-report/
```

---

## 📝 Best Practices

### 1. Test Naming Convention

```javascript
// Good
test('should return 404 for invalid flight code', async () => {})
test('VN456 should be Delayed with delay_minutes > 0', async () => {})

// Bad
test('test1', async () => {})
test('flight test', async () => {})
```

### 2. AAA Pattern

```javascript
test('should calculate compensation', async () => {
  // Arrange
  const payload = { delay_minutes: 180, ticket_price: 2000000 };
  
  // Act
  const res = await api.post('/api/mcp/calculate_compensation', payload);
  
  // Assert
  expect(res.status).toBe(200);
  expect(res.body.result.eligible).toBe(true);
});
```

### 3. Use Fixtures

```javascript
const { getFlightFixture } = require('../utils/test-helpers');

test('should match fixture data', async () => {
  const expected = getFlightFixture('onTime');
  const res = await api.get('/api/flights');
  const actual = res.body.find(f => f.flight_code === 'VN123');
  
  expect(actual.status).toBe(expected.status);
});
```

### 4. Handle Async Properly

```javascript
// Good
test('async test', async () => {
  const res = await api.get('/api/health');
  expect(res.status).toBe(200);
});

// Bad - missing await
test('async test', async () => {
  const res = api.get('/api/health'); // Missing await!
  expect(res.status).toBe(200);
});
```

---

## 🐛 Troubleshooting

### API tests failing with connection error

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check Docker
docker-compose ps
docker-compose logs backend
```

### E2E tests timing out

```javascript
// Increase timeout in playwright.config.ts
use: {
  actionTimeout: 30000,
  navigationTimeout: 60000,
}
```

### Database connection issues

```bash
# Verify PostgreSQL is running
docker-compose ps | grep postgres

# Check connection
psql postgresql://postgres:postgres@localhost:5432/flight_db
```

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Supertest](https://github.com/ladjs/supertest)

---

*Flight Checker Test Automation - Emesoft © 2024*
