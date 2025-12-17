# 🛫 Flight Checker AI - Reference Architecture

> **Dự án mẫu (Reference Project)** cho các team phát triển ứng dụng AI với LLM, MCP Tools, A2A Pattern  
> **Tech Stack:** React + Express.js + PostgreSQL + OpenAI GPT-4 + Docker

---

## 📋 Mục Lục

- [Tổng Quan](#-tổng-quan)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Đặc Tính Kỹ Thuật](#-đặc-tính-kỹ-thuật)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Hướng Dẫn Setup cho Developer](#-hướng-dẫn-setup-cho-developer)
- [Hướng Dẫn Automation Test cho QC](#-hướng-dẫn-automation-test-cho-qc)
- [API Reference](#-api-reference)
- [Best Practices](#-best-practices)

---

## 🎯 Tổng Quan

**Flight Checker AI** là ứng dụng demo trợ lý thông minh hỗ trợ tra cứu thông tin chuyến bay, thời tiết sân bay, và tính toán bồi thường. Dự án này được thiết kế như một **reference architecture** cho các ứng dụng AI của công ty.

### Tính Năng Chính

| Tính Năng | Mô Tả |
|-----------|-------|
| 🔍 Tra cứu chuyến bay | Tìm kiếm thông tin chuyến bay theo mã (VN123, VJ789...) |
| 🌤️ Thời tiết sân bay | Xem thời tiết hiện tại tại các sân bay Việt Nam |
| 💰 Tính bồi thường | Tự động tính toán mức bồi thường cho chuyến bay delay/hủy |
| 🔄 Chuyến bay thay thế | Đề xuất các chuyến bay thay thế khi có sự cố |
| 💬 Hội thoại đa lượt | Hỗ trợ ngữ cảnh trong cuộc hội thoại |

### Services Overview

| Service | URL | Mô Tả |
|---------|-----|-------|
| **Frontend** | http://localhost:5173 | React UI với TailwindCSS |
| **Backend API** | http://localhost:3001 | Express.js + OpenAI Integration |
| **PostgreSQL** | localhost:5432 | Database chính |
| **pgAdmin** | http://localhost:5050 | Database management UI |

---

## 🏗️ Kiến Trúc Hệ Thống

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  React Frontend (Vite + TailwindCSS)                                    │ │
│  │  - Chat Interface                                                        │ │
│  │  - Flight/Weather/Airport Tabs                                           │ │
│  │  - Real-time Agent Logs Viewer                                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ HTTP/REST
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                              API LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Express.js Backend                                                      │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────┐│ │
│  │  │ REST APIs     │  │ MCP Tools     │  │ A2A Agent Orchestration      ││ │
│  │  │ /api/chat     │  │ search_flight │  │ Flight Agent                 ││ │
│  │  │ /api/flights  │  │ get_weather   │  │ Weather Agent                ││ │
│  │  │ /api/airports │  │ list_flights  │  │ Support Agent                ││ │
│  │  │ /api/weather  │  │ find_alt...   │  │ Orchestrator                 ││ │
│  │  │ /api/mcp/:tool│  │ calc_comp...  │  │                              ││ │
│  │  └───────────────┘  └───────────────┘  └───────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   OpenAI GPT-4      │    │   External      │
│   - airports    │    │   - Chat Completion │    │   Services      │
│   - flights     │    │   - Function Calling│    │   (Future)      │
│   - weather     │    │   - Tool Execution  │    │                 │
│   - bookings    │    │                     │    │                 │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
```

### MCP (Model Context Protocol) Pattern

```
User Query: "VN456 bị delay bao lâu?"
                    │
                    ▼
            ┌───────────────┐
            │  Orchestrator │
            └───────┬───────┘
                    │ 1. Parse Intent
                    ▼
            ┌───────────────┐
            │   OpenAI LLM  │ ──► Function Calling
            └───────┬───────┘
                    │ 2. Select Tools
                    ▼
    ┌───────────────────────────────────────┐
    │           MCP Tool Execution          │
    ├───────────────┬───────────────────────┤
    │ search_flight │ get_weather           │
    │      ▼        │      ▼                │
    │  Flight DB    │  Weather DB           │
    └───────────────┴───────────────────────┘
                    │ 3. Aggregate Results
                    ▼
            ┌───────────────┐
            │   OpenAI LLM  │ ──► Generate Response
            └───────┬───────┘
                    │ 4. Format Response
                    ▼
            "Chuyến VN456 bị delay 45 phút..."
```

### A2A (Agent-to-Agent) Pattern

```
                    ┌───────────────────────┐
                    │    ORCHESTRATOR       │
                    │    (Main Agent)       │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ FLIGHT AGENT  │      │ WEATHER AGENT │      │ SUPPORT AGENT │
│               │      │               │      │               │
│ search_flight │      │ get_weather   │      │ calc_comp     │
│ list_flights  │      │               │      │ find_alt      │
│               │      │               │      │               │
└───────────────┘      └───────────────┘      └───────────────┘
```


### Cloud Architecture (GCP)

Hệ thống được triển khai trên Google Cloud Platform với kiến trúc Serverless hiện đại:

| Component | GCP Service | Chi Tiết |
|-----------|-------------|----------|
| **Frontend** | Cloud Run | `flight-checker-ui` - React App host trên Nginx, auto-scaling |
| **Backend** | Cloud Run | `flight-checker-api` - Node.js App, kết nối DB qua Unix Socket |
| **Database** | Cloud SQL | PostgreSQL 15, managed relation database |
| **Network** | VPC & LB | HTTPS Load Balancer mặc định của Cloud Run, VPC connector (optional) |
| **Registry** | Artifact Registry | Lưu trữ Docker Images bảo mật |
| **IaC** | Terraform | Quản lý toàn bộ infrastructure bằng code |

**Luồng kết nối:**
1. User truy cập URL Frontend (HTTPS) -> Cloud Run Load Balancer.
2. Frontend gọi API -> Cloud Run Service URL của Backend.
3. Backend kết nối Database -> Cloud SQL Auth Proxy (Sidecar) -> Cloud SQL Instance.

---

## ⚡ Đặc Tính Kỹ Thuật

### 1. Backend (Express.js)

| Đặc Tính | Chi Tiết |
|----------|----------|
| **Framework** | Express.js 4.x |
| **Language** | JavaScript (ES Modules) |
| **Database** | PostgreSQL 16 với pg driver |
| **AI Integration** | OpenAI GPT-4o-mini (configurable) |
| **API Style** | RESTful + Function Calling |

**Key Features:**
- ✅ MCP Tools Pattern với 6 tools được định nghĩa
- ✅ A2A Agent Orchestration với logging
- ✅ Iterative tool calling (max 10 iterations)
- ✅ Tool usage tracking cho testing
- ✅ Request validation và error handling
- ✅ Health check endpoint với DB connectivity

### 2. Frontend (React + Vite)

| Đặc Tính | Chi Tiết |
|----------|----------|
| **Framework** | React 18 + Vite 5 |
| **Styling** | TailwindCSS 3.4 |
| **Icons** | Lucide React |
| **Build** | Vite + NGINX (production) |

**Key Features:**
- ✅ Real-time chat interface
- ✅ Agent activity logs viewer
- ✅ Multi-tab navigation (Chat, Flights, Weather, Airports)
- ✅ Responsive design
- ✅ Vietnamese language support

### 3. Database (PostgreSQL)

| Table | Mô Tả |
|-------|-------|
| `airports` | 6 sân bay Việt Nam với thông tin lounges |
| `flights` | 14 chuyến bay mẫu (On Time, Delayed, Cancelled) |
| `weather` | Thông tin thời tiết theo sân bay |
| `bookings` | Đặt chỗ của hành khách |

**Views:**
- `v_flight_details` - Chi tiết chuyến bay với thông tin sân bay và thời tiết
- `v_disrupted_flights` - Các chuyến bay bị delay/hủy

### 4. Testing Architecture

| Loại Test | Framework | Số Lượng | Mô Tả |
|-----------|-----------|----------|-------|
| API Tests | Jest + Supertest | 24 | Unit tests cho REST endpoints |
| LLM Behavioral | Jest + Custom Evaluators | 20 | Response quality, tool selection |
| LLM Adversarial | Jest | 8 | Prompt injection, edge cases |
| Security | Jest | 10 | SQL injection resistance |
| Load | Jest | 1 | 50 concurrent requests |
| Chaos | Jest | 3 | Resilience testing |
| Integration | Jest | 14 | Database connectivity |
| E2E | Playwright | 4+ | Browser automation |

**Tổng: 80+ tests với 100% pass rate**

### 5. DevOps & Infrastructure

| Component | Tool |
|-----------|------|
| **Containerization** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |
| **Database Management** | pgAdmin 4 |
| **Environment** | .env files cho mỗi môi trường |

---

## 📁 Cấu Trúc Dự Án

```
flight-checker/
├── 📁 client/                    # Frontend React Application
│   ├── 📁 src/
│   │   ├── App.jsx               # Main component với chat UI
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── Dockerfile                # NGINX production build
│   ├── nginx.conf                # NGINX configuration
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite configuration
│
├── 📁 server/                    # Backend Express Application
│   ├── index.js                  # Main server với MCP tools + A2A
│   ├── Dockerfile                # Node.js production build
│   ├── package.json              # Backend dependencies
│   └── .env                      # Environment variables
│
├── 📁 database/
│   └── init.sql                  # Schema + Seed data
│
├── 📁 tests/                     # Test Suite (80+ tests)
│   ├── 📁 __config__/            # Jest & Playwright config
│   │   ├── jest.config.js
│   │   ├── playwright.config.ts
│   │   └── .env.test
│   ├── 📁 api/                   # API endpoint tests
│   │   ├── health.test.js
│   │   ├── flights.test.js
│   │   ├── airports.test.js
│   │   ├── chat.test.js
│   │   └── mcp-tools.test.js
│   ├── 📁 llm/                   # LLM behavior tests
│   │   ├── 📁 behavioral/        # Quality, consistency
│   │   ├── 📁 adversarial/       # Security, edge cases
│   │   ├── 📁 evaluators/        # Custom evaluators
│   │   └── 📁 golden-sets/       # Test data
│   ├── 📁 security/              # SQL injection tests
│   ├── 📁 load/                  # Load testing
│   ├── 📁 chaos/                 # Resilience tests
│   ├── 📁 integration/           # Database tests
│   ├── 📁 e2e/                   # Browser tests
│   └── 📁 utils/                 # Test helpers
│
├── 📁 .github/
│   └── 📁 workflows/
│       └── advanced-tests.yml    # CI/CD pipeline
│
├── docker-compose.yml            # Multi-container orchestration
├── package.json                  # Root package (test scripts)
├── .env                          # Environment variables
└── README.md                     # This file
```

---

## 🚀 Hướng Dẫn Setup cho Developer

### Prerequisites

- **Docker Desktop** (v4.0+)
- **Node.js** (v18+ recommended, v20 for full compatibility)
- **npm** (v9+)
- **OpenAI API Key** (từ https://platform.openai.com)

### Quick Start (Docker - Recommended)

```bash
# 1. Clone repository
git clone https://github.com/howard-tech/flight-checker.git
cd flight-checker

# 2. Tạo file .env với OpenAI API key
cat > .env << EOF
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
EOF

# 3. Start all services
docker compose up -d --build

# 4. Verify services are running
docker ps

# 5. Open browser
open http://localhost:5173
```

### Development Mode (Local)

#### Backend Development

```bash
# 1. Navigate to server
cd server

# 2. Install dependencies
npm install

# 3. Create .env file
cat > .env << EOF
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flight_db
DB_USER=postgres
DB_PASSWORD=postgres
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
EOF

# 4. Start PostgreSQL (via Docker)
docker compose up -d postgres

# 5. Run development server
npm run dev
```

#### Frontend Development

```bash
# 1. Navigate to client (new terminal)
cd client

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (required) | - |
| `OPENAI_MODEL` | GPT model to use | `gpt-4o-mini` |
| `PORT` | Backend server port | `3001` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `flight_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |

---

## 🛠️ Hướng Dẫn DevOps (Terraform)

Dự án sử dụng **Terraform** để tự động hóa việc khởi tạo hạ tầng (Infrastructure as Code) hỗ trợ Multi-Cloud (GCP & AWS).

### 1. Cấu Trúc Terraform
Code nằm trong thư mục `terraform/`:
- `gcp/`: Module định nghĩa tài nguyên cho GCP (Cloud Run, Cloud SQL, AR).
- `aws/`: Module định nghĩa tài nguyên cho AWS (App Runner, RDS, VPC).
- `main.tf`: Root module điều phối cả 2 cloud.

### 2. Yêu Cầu (Prerequisites)
- [Terraform CLI](https://developer.hashicorp.com/terraform/downloads) (v1.0+)
- **GCP Credentials**: Chạy `gcloud auth application-default login`
- **AWS Credentials**: Cấu hình `aws configure` hoặc biến môi trường `AWS_ACCESS_KEY_ID`

### 3. Quy Trình Deployment

**Bước 1: Khởi tạo Project**
```bash
cd terraform
terraform init
```

**Bước 2: Cấu hình Biến & Secrets**
Tạo file `terraform.tfvars` trong thư mục `terraform/` (File này đã được gitignore):

```hcl
gcp_project_id = "your-project-id"   # ID project GCP của bạn
gcp_region     = "asia-southeast1"   # Region mong muốn
db_password    = "your-secure-pass"  # Password cho DB Admin
openai_api_key = "sk-..."            # Key OpenAI
```

**Bước 3: Review Plan**
Kiểm tra các tài nguyên sẽ được tạo:
```bash
terraform plan
```

**Bước 4: Provisioning (Tạo Hạ Tầng)**
```bash
terraform apply
```
*Gõ `yes` để xác nhận.*

**Bước 5: Kết Quả**
Sau khi chạy xong, Terraform sẽ xuất ra các endpoint:
- `gcp_ui_url`: URL Frontend trên GCP
- `gcp_api_url`: URL API trên GCP
- `aws_ui_url`: URL Frontend trên AWS
- `aws_api_url`: URL API trên AWS

### 4. Xóa Hạ Tầng (Cleanup)
```bash
terraform destroy
```
*Lưu ý: Hành động này sẽ xóa toàn bộ database và services.*

---

## 🧪 Hướng Dẫn Automation Test cho QC

### Test Suite Overview

```
tests/
├── api/          → 24 tests  → REST API endpoints
├── llm/          → 28 tests  → LLM behavior & quality
├── security/     → 10 tests  → SQL injection resistance  
├── load/         → 1 test    → 50 concurrent requests
├── chaos/        → 3 tests   → Resilience & error handling
├── integration/  → 14 tests  → Database connectivity
└── e2e/          → 4+ tests  → Browser automation
                    ─────────
Total:              80+ tests
```

### Prerequisites for Testing

```bash
# 1. Ensure Docker services are running
docker compose up -d

# 2. Install test dependencies (from root folder)
npm install
```

### Running Tests

#### Run All Tests
```bash
npm test
```

#### Run by Category

```bash
# API Tests
npm run test:api

# LLM Tests (requires running backend)
npm run test:llm

# Integration Tests
npm run test:integration

# E2E Tests (Playwright)
npm run test:e2e

# With Coverage Report
npm run test:coverage

# Watch Mode (for development)
npm run test:watch
```

#### Run Specific Test File

```bash
# Single file
npx jest tests/api/flights.test.js

# Pattern matching
npx jest --testPathPattern="security"

# With verbose output
npx jest tests/llm/behavioral/consistency.test.js --verbose
```

### Test Environment Configuration

```bash
# tests/__config__/.env.test
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flight_db
OPENAI_API_KEY=your-test-key-here
```

### Understanding Test Results

```
Test Suites: 16 passed, 16 total
Tests:       80 passed, 80 total
Snapshots:   0 total
Time:        58.156 s
```

### Test Categories Explained

#### 1. API Tests (`tests/api/`)
Kiểm tra các REST endpoints:
- `health.test.js` - Health check và DB connectivity
- `flights.test.js` - CRUD operations cho flights
- `airports.test.js` - Airport data retrieval
- `chat.test.js` - Chat endpoint với LLM
- `mcp-tools.test.js` - Direct MCP tool calls

#### 2. LLM Behavioral Tests (`tests/llm/behavioral/`)
Kiểm tra chất lượng response của LLM:
- `response-quality.test.js` - Độ chính xác response
- `consistency.test.js` - Tính nhất quán qua nhiều lần gọi
- `tool-selection.test.js` - Chọn đúng tool cho query
- `multi-turn.test.js` - Giữ ngữ cảnh trong hội thoại
- `advanced-quality.test.js` - Hallucination detection

#### 3. LLM Adversarial Tests (`tests/llm/adversarial/`)
Kiểm tra bảo mật LLM:
- `prompt-injection.test.js` - Chống prompt injection attacks
- `edge-cases.test.js` - Xử lý input bất thường

#### 4. Security Tests (`tests/security/`)
- `sql-injection.test.js` - Chống SQL injection

#### 5. Load Tests (`tests/load/`)
- `api-load.test.js` - 200 requests với 50 concurrent

#### 6. Chaos Tests (`tests/chaos/`)
- `resilience.test.js` - Timeout, large payload, malformed JSON

### Writing New Tests

```javascript
// Example: New API test
const { api } = require('../utils/api-client');

describe('New Feature', () => {
    test('should do something', async () => {
        const res = await api.get('/api/new-endpoint');
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('expected_field');
    });
});
```

### CI/CD Integration

Tests chạy tự động qua GitHub Actions:
- **Trigger:** Nightly (00:00 UTC) hoặc manual
- **Environment:** Ubuntu + PostgreSQL service
- **Secrets Required:** `OPENAI_API_KEY`

---

## 📡 API Reference

### Chat API

```http
POST /api/chat
Content-Type: application/json

{
    "message": "VN123",
    "history": []
}
```

**Response:**
```json
{
    "success": true,
    "response": "✈️ **Thông tin chuyến bay VN123**...",
    "tools_used": ["search_flight", "get_weather"],
    "logs": [...],
    "usage": {
        "prompt_tokens": 485,
        "completion_tokens": 150,
        "total_tokens": 635
    }
}
```

### MCP Tools API

```http
POST /api/mcp/search_flight
POST /api/mcp/get_weather
POST /api/mcp/list_flights
POST /api/mcp/find_alternatives
POST /api/mcp/calculate_compensation
POST /api/mcp/get_airport_info
```

### Data APIs

```http
GET /api/health          # Health check
GET /api/flights         # List all flights
GET /api/flights/:code   # Get flight by code
GET /api/airports        # List all airports
GET /api/weather         # List all weather data
```

---

## 📚 Best Practices

### 1. Code Standards
- ESLint + Prettier for consistent formatting
- ES Modules (`import/export`)
- Async/await over callbacks
- Error handling with try/catch

### 2. Testing Standards
- Test files co-located với test pattern `*.test.js`
- Use fixtures for test data
- Mock external services when possible
- Aim for 80%+ code coverage

### 3. Security
- Environment variables for secrets
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- LLM prompt injection protection

### 4. Docker Best Practices
- Multi-stage builds
- Health checks
- Volume mounts for development
- Network isolation

---

## 📞 Support

- **Documentation:** Xem thêm tại `AGENT.md` và `test-llm-automation.md`
- **Issues:** Tạo issue trên GitHub repository
- **Contact:** Technical team

---

## 📝 License

MIT License - Xem file `LICENSE` để biết thêm chi tiết.
