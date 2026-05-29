# Blog Generator Frontend

React + Vite + TypeScript UI for the Blog Generator API.

## Setup

```bash
cd Frontend
npm install
cp .env.example .env
# Edit VITE_API_BASE_URL (default http://localhost:8000)

npm run dev
```

Open http://localhost:5173

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL (no trailing slash) |

## Deploy to Vercel

1. Import repo, set **Root Directory** to `Frontend`.
2. Add `VITE_API_BASE_URL` = your Render backend URL.
3. Deploy.

`vercel.json` handles SPA routing on refresh.
