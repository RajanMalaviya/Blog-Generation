# Blog Generator API

FastAPI backend that validates blog generation requests and triggers an n8n workflow (Tavily + Groq).

## Local setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your n8n webhook URL and secret

uvicorn app.main:app --reload --port 8000
```

Swagger UI: http://localhost:8000/docs

## Environment variables

| Variable | Description |
|----------|-------------|
| `N8N_WEBHOOK_URL` | Full n8n production webhook URL |
| `N8N_WEBHOOK_SECRET` | Shared secret sent as `x-webhook-secret` header |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (e.g. Vercel URL) |
| `N8N_TIMEOUT_SECONDS` | Max wait for n8n (default 120) |
| `RATE_LIMIT_PER_MINUTE` | Per-IP limit on `/blog/generate` (default 10) |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/blog/generate` | Generate blog via n8n |

## Deploy to Render

1. Connect this repo to Render.
2. Set root directory to `backend` (or use `render.yaml` at repo root).
3. Add env vars from `.env.example`.
4. Deploy and copy the service URL for the frontend `VITE_API_BASE_URL`.
