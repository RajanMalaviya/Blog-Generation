---
title: Blog Generator API
sdk: docker
app_port: 7860
---

# Blog Generator

Production-style AI blog platform: React frontend → FastAPI backend → n8n workflow (Tavily web search + Groq LLM).

**Share one link:** your Vercel frontend URL (e.g. `https://your-app.vercel.app`).

## Architecture

```
Browser → Vercel (React) → Render (FastAPI) → n8n → Tavily + Groq
```

| Component | Folder | Deploy |
|-----------|--------|--------|
| Frontend | [`Frontend/`](Frontend/) | [Vercel](https://vercel.com) |
| Backend | [`Backend/`](Backend/) | [Render](https://render.com) |
| Workflow | [`n8n/`](n8n/) | [n8n Cloud](https://n8n.io) |

## User inputs

- Blog title, primary keywords (1–5), secondary keywords (0–10)
- Target audience, tone, length, language
- Optional additional instructions

## Quick start (local)

### 1. n8n workflow

See [`n8n/README.md`](n8n/README.md). Import `blog-generate-workflow.json`, set `WEBHOOK_SECRET`, `TAVILY_API_KEY`, `GROQ_API_KEY`, activate, copy webhook URL.

### 2. Backend

```bash
cd Backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env       # set N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET
uvicorn app.main:app --reload --port 8000
```

Swagger: http://localhost:8000/docs

### 3. Frontend

```bash
cd Frontend
npm install
copy .env.example .env       # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Open http://localhost:5173

## Environment variables

### Backend (`Backend/.env`)

| Key | Description |
|-----|-------------|
| `N8N_WEBHOOK_URL` | n8n production webhook URL |
| `N8N_WEBHOOK_SECRET` | Same as n8n `WEBHOOK_SECRET` |
| `ALLOWED_ORIGINS` | `http://localhost:5173` or Vercel URL |

### Frontend (`Frontend/.env`)

| Key | Description |
|-----|-------------|
| `VITE_API_BASE_URL` | Backend URL |

### n8n (cloud variables)

| Key | Description |
|-----|-------------|
| `WEBHOOK_SECRET` | Shared with backend |
| `TAVILY_API_KEY` | [tavily.com](https://tavily.com) |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/blog/generate` | Generate blog |

## Production deploy

Full step-by-step: **[DEPLOY.md](DEPLOY.md)**

Order: n8n → Render backend → Vercel frontend → update CORS `ALLOWED_ORIGINS`.

## Demo URL

After deploy, set your live link here:

```
https://YOUR-APP.vercel.app
```

## External accounts

- [Tavily](https://tavily.com) — web search
- [Groq](https://groq.com) — LLM
- [n8n Cloud](https://n8n.io) — workflow
- [Render](https://render.com) — API
- [Vercel](https://vercel.com) — UI
