# NYC Rental Intelligence Demo

An AI-powered rental agent workspace demo: from natural language requirements to explainable listing recommendations, comparisons, building research, and client communication — all in a single broker-facing workspace.

## What's New (Phase 3)

The demo has been upgraded from a multi-page rental search tool into a **single-page Agent/Broker Workspace**:

- **Agent Workspace** — Three-panel layout (Client Context · Agent Console · Display Panel) at `/workspace`
- **Agent Orchestration** — LLM-powered intent classification maps broker commands to backend actions
- **Client Context Layer** — Client profiles, notes, shortlist status, preference weights
- **Pipeline Panel** — Search → Fetch → Validate → DB pipeline visible inline (no separate page)
- **Sent History & Feedback** — Message drafts recorded per client; feedback drives re-ranking
- **Tabbed Display Panel** — Listings · Fit Analysis · Building Research · Compare · Message Preview

## Agent Workspace Demo Flow

```
Agent Console input (natural language)
  ↓
/api/agent/action (intent classification → action dispatch)
  ↓
Existing services (query / fit / compare / research / notify)
  ↓
Right panel tab update (Listings / Fit / Research / Compare / Message)
```

Example broker commands:
- `"帮 Emily 找 LIC studio，预算 3200 以下，安静优先"` → search + Listings tab
- `"研究 top 1 的楼宇评价"` → Research tab
- `"把选中的房源进行对比分析"` → Compare tab
- `"生成微信推送消息"` → Message tab + sent history

## Classic Demo Flow (still available as individual pages)

1. **Intake** (`/`) — NL requirements → structured search profile
2. **Run Studio** (`/runs`) — Search → Process → Database pipeline
3. **Listings** (`/listings`) — Browse structured listings with filters
4. **NL Query** (`/query`) — Ask in plain English, get ranked results
5. **Fit Analysis** — Personalized fit score with pros/cons per listing
6. **Compare** (`/compare`) — Side-by-side comparison with AI verdict
7. **Review Intelligence** (`/research/[id]`) — Building reputation research
8. **Push** (`/notify`) — Send shortlist to WeCom/WeChat

## Quick Start

### Option A: Docker (recommended)

```bash
cp .env.example .env   # fill in ANTHROPIC_API_KEY or OPENAI_API_KEY
docker compose up --build
```

| Service | URL |
|---------|-----|
| Agent Workspace | http://localhost:3102/workspace |
| API docs (Swagger) | http://localhost:8102/docs |

> Default host ports: web `3102`, api `8102`. Override with `WEB_HOST_PORT` / `API_HOST_PORT` in `.env`.

### Option B: Manual dev

**Backend (FastAPI)**

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env   # fill in ANTHROPIC_API_KEY or OPENAI_API_KEY
uvicorn apps.api.main:app --reload --port 8000
```

**Frontend (Next.js)**

```bash
cd apps/web
npm install
npm run dev   # http://localhost:3000
```

Open **http://localhost:3000/workspace** for the Agent Workspace.

## Project Structure

```
rental-demo/
├── apps/
│   ├── api/
│   │   ├── main.py                  # FastAPI app (10 routers registered)
│   │   └── routers/
│   │       ├── intake.py            # POST /api/intake
│   │       ├── listings.py          # GET  /api/listings
│   │       ├── query.py             # POST /api/query/nl
│   │       ├── analysis.py          # POST /api/analysis/fit|compare
│   │       ├── research.py          # GET|POST /api/research/*
│   │       ├── runs.py              # POST /api/runs/demo|live
│   │       ├── notify.py            # POST /api/notify/wecom
│   │       ├── clients.py           # CRUD /api/clients/*        [Phase 3]
│   │       ├── agent.py             # POST /api/agent/action     [Phase 3]
│   │       └── feedback.py          # POST|GET /api/feedback/*   [Phase 3]
│   └── web/
│       ├── app/
│       │   ├── workspace/page.tsx   # Agent Workspace (3-panel)  [Phase 3]
│       │   ├── page.tsx             # Intake / Command Center
│       │   ├── runs/page.tsx        # Run Studio
│       │   ├── listings/page.tsx    # Listings browser
│       │   ├── query/page.tsx       # NL Query
│       │   ├── recommendations/     # Top 3 Recommendations
│       │   ├── compare/page.tsx     # Side-by-side Compare
│       │   ├── research/[id]/       # Building Research
│       │   └── notify/page.tsx      # WeCom Push
│       └── components/
│           ├── workspace/           # Workspace components        [Phase 3]
│           │   ├── ClientPanel.tsx
│           │   ├── WorkflowProgress.tsx
│           │   ├── AgentConsole.tsx
│           │   ├── PipelinePanel.tsx
│           │   ├── DisplayPanel.tsx
│           │   └── tabs/            # Listings|Fit|Research|Compare|Message
│           ├── ListingCard.tsx
│           ├── WorkflowStepper.tsx
│           ├── ScoreRing.tsx
│           ├── RiskBadge.tsx
│           └── LicMiniMap.tsx
├── src/
│   ├── pipeline/
│   │   └── storage.py               # JSONL append-only storage
│   └── services/
│       ├── llm_client.py            # Anthropic/OpenAI abstraction
│       ├── intake_service.py        # NL → structured profile
│       ├── listing_service.py       # Load/filter/enrich listings
│       ├── query_service.py         # NL query → filters → ranking
│       ├── fit_analysis_service.py  # Per-listing fit score
│       ├── comparison_service.py    # Multi-listing comparison
│       ├── review_research_service.py # Building reputation
│       ├── openclaw_service.py      # OpenClaw pipeline adapter
│       ├── run_import_service.py    # Import listings from pipeline
│       ├── client_service.py        # Client profiles + shortlist  [Phase 3]
│       ├── agent_action_service.py  # Intent → action dispatch     [Phase 3]
│       └── feedback_service.py      # Feedback + sent history      [Phase 3]
├── db/                              # JSONL file database (gitignored)
├── seed/lic_studio_demo/            # 13 LIC studio demo listings
├── artifacts/                       # Cached AI outputs (gitignored)
└── schemas/listing_record.schema.json
```

## Architecture

```
Browser (/workspace)
  ↓
Next.js App Router
  ↓
FastAPI  (/api/agent/action  ← new orchestration layer)
  ↓                    ↓
Intent Classifier   Existing Services
  ↓                    ↓
Action Dispatch → query / fit / compare / research / notify
  ↓
JSONL DB / Seed Data / OpenClaw Adapter
  ↓
LLM (Claude / GPT with heuristic fallback)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/intake` | NL text → structured user profile |
| GET | `/api/listings` | List listings with filters |
| POST | `/api/query/nl` | NL search → ranked results |
| POST | `/api/analysis/fit` | Fit score for one listing |
| POST | `/api/analysis/compare` | Compare 2-3 listings |
| GET/POST | `/api/research/*` | Building reputation research |
| POST | `/api/runs/demo` | Trigger demo pipeline run |
| POST | `/api/notify/wecom` | Generate WeCom shortlist message |
| GET/POST | `/api/clients/*` | Client profile CRUD |
| POST | `/api/agent/action` | Broker command → action dispatch |
| GET/POST | `/api/feedback/*` | Client feedback + sent history |

Interactive docs: **http://localhost:8000/docs**

## Demo Mode vs Live Mode

- **Demo Mode** (`DEMO_MODE=true`, default): Uses 13 pre-seeded LIC studio listings from `seed/lic_studio_demo/`. Stable for presentations. LLM calls fall back to heuristics if no API key.
- **Live Mode**: Triggers real pipeline via OpenClaw adapter. Requires `OPENCLAW_RENTAL_REPO_PATH` and API keys.

## Environment Variables

```bash
ANTHROPIC_API_KEY=...          # Primary LLM (Claude)
OPENAI_API_KEY=...             # Fallback LLM (GPT)
DEMO_MODE=true                 # Use seed data (recommended)

# Docker host ports (container always uses 8000/3000 internally)
API_HOST_PORT=8102             # Host port for API  → http://localhost:8102
WEB_HOST_PORT=3102             # Host port for web  → http://localhost:3102

# Docker: browser-visible API URL (set automatically by docker-compose)
NEXT_PUBLIC_API_URL=http://localhost:8102

# Docker: allowed CORS origins for FastAPI (comma-separated)
CORS_ORIGINS=http://localhost:3102,http://127.0.0.1:3102

WECOM_WEBHOOK_URL=...          # Optional: WeCom push
OPENCLAW_RENTAL_REPO_PATH=...  # Optional: live pipeline
```
