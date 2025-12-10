# 🛫 AI Flight Assistant

Full-stack demo: **LLM (OpenAI GPT-4)** + **MCP** + **A2A** + **PostgreSQL**

## 🚀 Quick Start

```bash
# 1. Add OpenAI API key
nano .env

# 2. Start all services
docker-compose up -d --build

# 3. Open browser
open http://localhost:5173
```

## 📊 Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |
| pgAdmin | http://localhost:5050 |
| PostgreSQL | localhost:5432 |

## 🧪 Test

- `VN123` - On Time flight
- `VN456` - Delayed flight
- `QH101` - Cancelled flight
- `thời tiết Hà Nội` - Weather

## 🏗️ Architecture

```
Frontend (React) → Backend (Express) → PostgreSQL
                      ↓
              OpenAI GPT-4 (LLM)
                      ↓
              MCP Tools + A2A Agents
```
