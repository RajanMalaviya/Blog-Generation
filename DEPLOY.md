# Deployment Guide

Deploy in this order: **n8n → Render (backend) → Vercel (frontend)**.

## 1. n8n Cloud

1. Sign up at [n8n.io](https://n8n.io).
2. Import [`n8n/blog-generate-workflow.json`](n8n/blog-generate-workflow.json).
3. Set variables (Settings → Variables):
   - `WEBHOOK_SECRET` — random string (e.g. `openssl rand -hex 32`)
   - `TAVILY_API_KEY` — from [tavily.com](https://tavily.com)
   - `GROQ_API_KEY` — from [console.groq.com](https://console.groq.com)
4. Activate the workflow.
5. Copy the **Production Webhook URL** from the Webhook node.

## 2. Render (Backend)

1. Push repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → New → Blueprint → connect repo (uses root `render.yaml`).
3. Set environment variables:
   | Key | Value |
   |-----|-------|
   | `N8N_WEBHOOK_URL` | Production webhook URL from n8n |
   | `N8N_WEBHOOK_SECRET` | Same as `WEBHOOK_SECRET` in n8n |
   | `ALLOWED_ORIGINS` | `https://YOUR-APP.vercel.app` (set after Vercel deploy) |
4. Deploy. Copy service URL (e.g. `https://blog-generator-api.onrender.com`).

**Note:** Free tier sleeps when idle; first request may take ~30s.

## 3. Vercel (Frontend)

1. [vercel.com](https://vercel.com) → Import Git repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**.
4. Environment variable:
   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | Your Render backend URL (no trailing slash) |
5. Deploy. Copy Vercel URL.

## 4. Final wiring

1. Update Render `ALLOWED_ORIGINS` with your Vercel URL.
2. Redeploy backend if CORS was wrong on first try.
3. Open Vercel URL — fill form → Generate Blog.

## Smoke test

```bash
curl https://YOUR-RENDER-URL/api/v1/health
```

```bash
curl -X POST https://YOUR-RENDER-URL/api/v1/blog/generate \
  -H "Content-Type: application/json" \
  -d '{"title":"Future of AI in Healthcare","primary_keywords":["ai","healthcare"],"secondary_keywords":["diagnostics"],"target_audience":"developers","tone":"professional","length":"short","language":"english"}'
```

## Single demo link

Share only: **`https://YOUR-APP.vercel.app`**
