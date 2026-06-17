# NYC Rental Intelligence Demo

An AI-powered end-to-end rental workflow demo: from natural language requirements to explainable listing recommendations, comparisons, and building review research.

## Demo Flow

1. **Intake** — Describe your requirements in natural language; AI parses them into a structured search profile
2. **Run Studio** — Watch the Search → Process → Database pipeline (demo mode uses stable seed data)
3. **Listings** — Browse structured listings with amenity tags and data quality badges
4. **Natural Language Query** — Ask "Show me quiet studios under $3,000 near the 7 train" and get ranked results
5. **Fit Analysis** — Get a personalized fit score with pros/cons for each listing
6. **Compare** — Side-by-side comparison of 2–3 listings with AI verdict
7. **Review Intelligence** — Building reputation research from multiple sources
8. **Push** — Send your shortlist to WeCom/WeChat

## Quick Start

### Backend (FastAPI)

```bash
cd /home/ubuntu/rental-demo
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env  # fill in API keys
uvicorn apps.api.main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd apps/web
npm install
npm run dev  # runs on port 3000
```

## Project Structure

```
rental-demo/
├── apps/
│   ├── api/          # FastAPI backend
│   └── web/          # Next.js 14 frontend
├── src/
│   ├── pipeline/     # Adapted from nyc-rentals-openclaw core modules
│   └── services/     # Business logic (listing, query, fit, compare, research)
├── db/               # JSONL file database
├── seed/             # Demo seed data (LIC studio listings)
├── artifacts/        # AI analysis outputs (fit reports, comparisons, reviews)
├── schemas/          # JSON Schema definitions
└── configs/          # Search profiles and source policies
```

## Architecture

```
Next.js UI  →  FastAPI API  →  Services  →  JSONL DB
                                    ↓
                               LLM (Claude/GPT)
                                    ↓
                          Pipeline (runner/extractor)
```

## Demo Mode vs Live Mode

- **Demo Mode** (`DEMO_MODE=true`): Uses pre-seeded stable data from `seed/lic_studio_demo/`. Recommended for presentations.
- **Live Mode**: Triggers real pipeline via OpenClaw-style search. Requires API keys and tolerates scraping failures.
