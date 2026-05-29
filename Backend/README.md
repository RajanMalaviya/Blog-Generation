# Blog Generator API

FastAPI backend that validates blog generation requests and triggers an n8n workflow using Tavily and Groq.

## Local Setup

```bash
cd Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Swagger UI: http://localhost:8000/docs

## Environment Variables

| Variable | Description |
|----------|-------------|
| `N8N_WEBHOOK_URL` | Full n8n production webhook URL |
| `N8N_WEBHOOK_SECRET` | Shared secret sent as `x-webhook-secret` header |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins, production uses `https://blog-generator-coral-seven.vercel.app` |
| `N8N_TIMEOUT_SECONDS` | Max wait for n8n, default `120` |
| `RATE_LIMIT_PER_MINUTE` | Per-IP limit on `/blog/generate`, default `10` |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/blog/generate` | Generate blog via n8n |

## Deploy to Hugging Face Spaces

The repo root is configured as a Docker Space with `app_port: 7860` in the root README front matter.

1. Push the repo to the Hugging Face Space.
2. Add backend secrets in the Space settings.
3. Rebuild or restart the Space after code or secret changes.
4. Use the Space URL as the frontend `VITE_API_BASE_URL`.

If n8n or Groq returns an empty/non-JSON response, the backend maps that to a clean `502` response instead of exposing a JSON parsing crash.
