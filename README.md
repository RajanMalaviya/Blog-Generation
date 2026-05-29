---
title: Blog Generator API
sdk: docker
app_port: 7860
---

# Blog Generator

Production-style AI blog platform: React frontend -> FastAPI backend -> n8n workflow (Tavily web search + Groq LLM).

**Production app:** https://blog-generator-coral-seven.vercel.app/

## Architecture

```text
Browser -> Vercel (React) -> Hugging Face Space (FastAPI) -> n8n -> Tavily + Groq
```

| Component | Folder | Deploy |
|-----------|--------|--------|
| Frontend | [`Frontend/`](Frontend/) | [Vercel](https://vercel.com) |
| Backend | [`Backend/`](Backend/) | [Hugging Face Spaces](https://huggingface.co/spaces) |
| Workflow | [`n8n/`](n8n/) | [n8n Cloud](https://n8n.io) |

## User Inputs

- Blog title, primary keywords (1-5), secondary keywords (0-10)
- Target audience, tone, length, language
- Optional additional instructions

## Quick Start

### 1. n8n Workflow

See [`n8n/README.md`](n8n/README.md). Import `blog-generate-workflow.json`, set `WEBHOOK_SECRET`, `TAVILY_API_KEY`, `GROQ_API_KEY`, activate the workflow, and copy the production webhook URL.

### 2. Backend

```bash
cd Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Swagger: http://localhost:8000/docs

### 3. Frontend

```bash
cd Frontend
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173

## Environment Variables

### Backend (`Backend/.env` or Hugging Face Space secrets)

| Key | Description |
|-----|-------------|
| `N8N_WEBHOOK_URL` | n8n production webhook URL |
| `N8N_WEBHOOK_SECRET` | Same value as n8n `WEBHOOK_SECRET` |
| `ALLOWED_ORIGINS` | `http://localhost:5173` locally; `https://blog-generator-coral-seven.vercel.app` in production |
| `N8N_TIMEOUT_SECONDS` | Max wait for n8n, default `120` |

### Frontend (`Frontend/.env` or Vercel env)

| Key | Description |
|-----|-------------|
| `VITE_API_BASE_URL` | Backend URL, for production use the Hugging Face Space URL without a trailing slash |

### n8n Cloud Variables

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

## Production Deploy

Full step-by-step: [DEPLOY.md](DEPLOY.md)

Order: n8n -> Hugging Face Space backend -> Vercel frontend -> update CORS `ALLOWED_ORIGINS`.

## Demo URLs

- Frontend: https://blog-generator-coral-seven.vercel.app/
- Backend: Hugging Face Space Docker app on port `7860`

## External Accounts

- [Tavily](https://tavily.com) - web search
- [Groq](https://groq.com) - LLM
- [n8n Cloud](https://n8n.io) - workflow
- [Hugging Face Spaces](https://huggingface.co/spaces) - API
- [Vercel](https://vercel.com) - UI
