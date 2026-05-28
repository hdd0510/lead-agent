# AI Lead Qualification Agent — MVP Demo

AI assistant that qualifies inbound real estate leads end-to-end: from first reply to booked viewing, with human agents stepping in only when it matters.

## Architecture

```
lead_agent/
├── backend/   ← Python FastAPI (AI engine, DB, qualification workflow)
└── frontend/  ← Next.js 15 (UI only — calls backend API)
```

**Stack:** Python FastAPI · OpenAI GPT-4o · SQLAlchemy + Neon Postgres · Next.js 15 · Tailwind CSS

## Quick Start

### 1. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Copy env file and fill in values
cp .env.example .env

# Run migrations and seed demo data
python -c "import asyncio; from db.database import create_tables; asyncio.run(create_tables())"
curl -X POST http://localhost:8000/demo/seed

# Start server
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install

# Create env file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_DEMO_MODE=true" >> .env.local

npm run dev  # runs on :3000
```

### 3. Open the app

- **Landing page** (lead's view): http://localhost:3000
- **Agent dashboard**: http://localhost:3000/dashboard
- **Configuration**: http://localhost:3000/config

## 5-Minute Demo Script

| Time | Action |
|------|--------|
| 0:00 | Open dashboard — Jean-Pierre HOT, viewing booked ✓ |
| 0:40 | Click Jean-Pierre → summary + next-action highlighted **(Magic Moment 1)** |
| 1:30 | Click Marie Dubois → draft panel with rule trigger **(Magic Moment 2)** |
| 2:00 | [Send Draft] → status updates live |
| 2:30 | Open Config → add plain-language rule → toggle draft mode **(Magic Moment 3)** |
| 4:00 | Go to landing → submit form as Thomas Bernard → watch qualify live |

## Environment Variables

### Backend (`backend/.env`)
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname
SENDGRID_API_KEY=          # optional for demo
SENDGRID_FROM_EMAIL=       # optional for demo
DEMO_MODE=true
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_MODE=true
```

## Demo Scenarios (pre-seeded)

| Lead | Status | Score | Magic Moment |
|------|--------|-------|--------------|
| Jean-Pierre Martin | Booked ✓ | HOT 87/100 | Autonomous booking |
| Marie Dubois | Draft waiting | WARM 62/100 | Rule handoff |
| Thomas Bernard | Active (2/4) | — | Live qualification |

## Deployment

- **Backend**: Railway or Render (Python runtime)
- **Frontend**: Vercel
- **Database**: Neon (serverless Postgres, free tier)
