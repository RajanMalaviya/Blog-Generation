# Deployment Guide

Deploy in this order: **n8n -> Hugging Face Space backend -> Vercel frontend**.

## 1. n8n Cloud

1. Sign up at [n8n.io](https://n8n.io).
2. Import [`n8n/blog-generate-workflow.json`](n8n/blog-generate-workflow.json).
3. Set variables under Settings -> Variables:
   - `WEBHOOK_SECRET` - random string, same value used by the backend.
   - `TAVILY_API_KEY` - from [tavily.com](https://tavily.com).
   - `GROQ_API_KEY` - from [console.groq.com](https://console.groq.com).
4. Activate the workflow.
5. Copy the Production Webhook URL from the Webhook node.

The workflow keeps Groq requests below the on-demand token-per-minute limit by using fewer Tavily results, trimming research snippets, and setting lower `max_tokens` values per blog length.

## 2. Hugging Face Space Backend

1. Create or open the Hugging Face Space for this repo.
2. Use Docker as the Space SDK. The repo root [`Dockerfile`](Dockerfile) starts FastAPI on port `7860`.
3. Add Space secrets:

| Key | Value |
|-----|-------|
| `N8N_WEBHOOK_URL` | Production webhook URL from n8n |
| `N8N_WEBHOOK_SECRET` | Same as `WEBHOOK_SECRET` in n8n |
| `ALLOWED_ORIGINS` | `https://blog-generator-coral-seven.vercel.app` |
| `APP_ENV` | `production` |
| `N8N_TIMEOUT_SECONDS` | `120` |

4. Rebuild or restart the Space after changing code or secrets.
5. Copy the Space URL. Use it as the frontend `VITE_API_BASE_URL` without a trailing slash.

## 3. Vercel Frontend

1. Import the Git repo in [Vercel](https://vercel.com).
2. Set Root Directory to `Frontend`.
3. Framework preset: Vite.
4. Set environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | Your Hugging Face Space backend URL, no trailing slash |

5. Deploy. Production frontend:

```text
https://blog-generator-coral-seven.vercel.app/
```

## 4. Final Wiring

1. Confirm Hugging Face `ALLOWED_ORIGINS` includes `https://blog-generator-coral-seven.vercel.app`.
2. Confirm Vercel `VITE_API_BASE_URL` points to the Hugging Face backend.
3. Confirm n8n is active and uses the production webhook URL.
4. Open the Vercel URL, fill the form, and generate a short blog first.

## Smoke Test

```bash
curl https://YOUR-HF-SPACE-URL/api/v1/health
```

```bash
curl -X POST https://YOUR-HF-SPACE-URL/api/v1/blog/generate \
  -H "Content-Type: application/json" \
  -d '{"title":"Future of AI in Healthcare","primary_keywords":["ai","healthcare"],"secondary_keywords":["diagnostics"],"target_audience":"developers","tone":"professional","length":"short","language":"english"}'
```

## Single Demo Link

Share only: **https://blog-generator-coral-seven.vercel.app/**
