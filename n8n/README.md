# n8n Blog Generation Workflow

Import `blog-generate-workflow.json` into [n8n Cloud](https://n8n.io) (or self-hosted n8n).

## Setup

1. **Import workflow** — Workflows → Import from File → select `blog-generate-workflow.json`.
2. **Variables** (n8n Cloud: **Settings → Variables**; not `$env` — Cloud blocks env access):
   - `WEBHOOK_SECRET` — same value as backend `N8N_WEBHOOK_SECRET`
   - `TAVILY_API_KEY` — from [tavily.com](https://tavily.com)
   - `GROQ_API_KEY` — from [console.groq.com](https://console.groq.com)

   The workflow uses `$vars.WEBHOOK_SECRET`, `$vars.TAVILY_API_KEY`, and `$vars.GROQ_API_KEY`.

3. **Publish** (if shown) and **Activate** the workflow.
4. Copy the **Production Webhook URL** from the Webhook node (path: `generate-blog`).
   - Use `/webhook/generate-blog`, not `/webhook-test/...`
5. Set backend env: `N8N_WEBHOOK_URL=<that URL>` and `N8N_WEBHOOK_SECRET=<WEBHOOK_SECRET>`.

### n8n Cloud: "access to env vars denied"

If **Validate Secret** fails with `N8N_BLOCK_ENV_ACCESS_IN_NODE`, re-import this workflow (it uses `$vars`, not `$env`) and define secrets under **Settings → Variables**.

### Groq LLM: "Bad control character in string literal" / invalid JSON

Tavily research text contains newlines and quotes. Do not paste `research_context` into a static JSON Body field. Use the **Build Groq Request** code node (included in this workflow) and set Groq **JSON Body** to `={{ $json.groq_request }}`.

## Flow

```
Webhook → Validate Secret → Build Search Query → Tavily Search
  → Format Research → Build Groq Request → Groq LLM → Format Response → Respond to Webhook
```

## Expected webhook payload (from FastAPI)

```json
{
  "title": "The Future of AI in Healthcare 2025",
  "primary_keywords": ["ai", "healthcare"],
  "secondary_keywords": ["machine learning"],
  "target_audience": "Software developers",
  "tone": "professional",
  "length": "medium",
  "language": "english",
  "additional_context": null
}
```

## Expected response (to FastAPI)

```json
{
  "blog": "## Title\n\n...(markdown)...",
  "word_count": 1024,
  "sources": ["https://example.com/article"]
}
```

## Test locally

From the repo root (loads `Backend\.env`):

```powershell
.\scripts\test-blog-flow.ps1 -Target N8n
```

Or curl:

```bash
curl -X POST "YOUR_N8N_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{"title":"Test Blog Title Here","primary_keywords":["ai"],"secondary_keywords":[],"target_audience":"developers","tone":"professional","length":"short","language":"english","additional_context":null}'
```

Success: **30–90 seconds**, JSON with `blog`, `word_count`, and `sources`.
