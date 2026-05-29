# Blog Generator — Backend Plan

## Tech Stack

| Tool | Purpose |
|---|---|
| Python 3.11+ | Language |
| FastAPI | Async web framework |
| Uvicorn | ASGI server |
| Pydantic v2 | Request/response validation + settings |
| httpx | Async HTTP client for calling n8n webhook |
| slowapi | Rate limiting middleware |
| python-dotenv | Load `.env` in development |
| loguru | Structured logging |

---

## Project Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn[standard] httpx pydantic pydantic-settings \
  slowapi python-dotenv loguru

# Save deps
pip freeze > requirements.txt
```

---

## Folder Structure

```
blog-generator-api/
├── app/
│   ├── __init__.py
│   ├── main.py               # FastAPI app entry point, middleware setup
│   ├── config.py             # Settings via pydantic-settings (reads .env)
│   ├── dependencies.py       # Shared dependencies (rate limiter, http client)
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── routes/
│   │           ├── __init__.py
│   │           ├── blog.py   # POST /generate endpoint
│   │           └── health.py # GET /health endpoint
│   ├── services/
│   │   └── n8n_service.py    # All n8n webhook communication logic
│   ├── models/
│   │   ├── request.py        # BlogRequest Pydantic model
│   │   └── response.py       # BlogResponse + ErrorResponse Pydantic models
│   └── core/
│       ├── exceptions.py     # Custom exception classes
│       └── logging.py        # Loguru setup
├── .env                      # Local dev only — never commit
├── .env.example              # Committed — shows required keys with no values
├── requirements.txt
├── render.yaml               # Render deployment config
└── README.md
```

---

## Configuration (Pydantic Settings)

```python
# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # n8n
    N8N_WEBHOOK_URL: str              # Full n8n webhook URL (from n8n trigger node)
    N8N_WEBHOOK_SECRET: str           # Secret header to authenticate calls to n8n

    # App
    APP_ENV: str = "development"      # "development" | "production"
    APP_VERSION: str = "1.0.0"

    # CORS — comma-separated allowed origins
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 10   # Requests per minute per IP

    # Timeouts
    N8N_TIMEOUT_SECONDS: int = 120    # n8n + LLM can be slow

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Singleton instance imported everywhere
settings = Settings()
```

---

## Models

```python
# app/models/request.py
from pydantic import BaseModel, Field, field_validator
from typing import Literal
from enum import Enum

class ToneEnum(str, Enum):
    professional = "professional"
    conversational = "conversational"
    academic = "academic"
    humorous = "humorous"
    persuasive = "persuasive"

class LengthEnum(str, Enum):
    short = "short"       # ~500 words
    medium = "medium"     # ~1000 words
    long = "long"         # ~2000 words

class LanguageEnum(str, Enum):
    english = "english"
    hindi = "hindi"
    spanish = "spanish"
    french = "french"
    german = "german"

class BlogRequest(BaseModel):
    title: str = Field(
        ...,
        min_length=5,
        max_length=150,
        examples=["The Future of AI in Healthcare 2025"],
    )
    keywords: list[str] = Field(
        ...,
        min_length=1,
        max_length=10,
        examples=[["AI", "healthcare", "machine learning"]],
    )
    target_audience: str = Field(
        ...,
        min_length=3,
        max_length=100,
        examples=["Software developers and startup founders"],
    )
    tone: ToneEnum = ToneEnum.professional
    length: LengthEnum = LengthEnum.medium
    language: LanguageEnum = LanguageEnum.english
    additional_context: str | None = Field(
        default=None,
        max_length=500,
    )

    @field_validator("keywords")
    @classmethod
    def strip_and_lowercase_keywords(cls, v: list[str]) -> list[str]:
        return [kw.strip().lower() for kw in v if kw.strip()]
```

```python
# app/models/response.py
from pydantic import BaseModel, HttpUrl
from datetime import datetime

class BlogResponse(BaseModel):
    blog: str                        # Full markdown blog content
    word_count: int
    sources: list[str] = []         # Source URLs from Tavily search
    generated_at: datetime

class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None
```

---

## n8n Service

All communication with the n8n webhook is isolated here. This makes it easy to swap n8n for a different workflow engine later without touching routes.

```python
# app/services/n8n_service.py
import httpx
from loguru import logger
from app.config import settings
from app.models.request import BlogRequest
from app.models.response import BlogResponse
from app.core.exceptions import N8NServiceError, N8NTimeoutError
from datetime import datetime, timezone

class N8NService:
    """
    Calls the n8n webhook and maps the response to BlogResponse.
    n8n workflow handles: Tavily web search → Groq LLM → format → respond.
    """

    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.webhook_url = settings.N8N_WEBHOOK_URL
        self.secret = settings.N8N_WEBHOOK_SECRET

    async def generate_blog(self, request: BlogRequest) -> BlogResponse:
        payload = {
            "title": request.title,
            "keywords": request.keywords,
            "target_audience": request.target_audience,
            "tone": request.tone.value,
            "length": request.length.value,
            "language": request.language.value,
            "additional_context": request.additional_context,
        }

        logger.info(f"Triggering n8n webhook | title='{request.title}' tone={request.tone}")

        try:
            response = await self.client.post(
                self.webhook_url,
                json=payload,
                headers={
                    "x-webhook-secret": self.secret,
                    "Content-Type": "application/json",
                },
                timeout=settings.N8N_TIMEOUT_SECONDS,
            )
            response.raise_for_status()

        except httpx.TimeoutException:
            logger.error("n8n webhook timed out")
            raise N8NTimeoutError("Blog generation timed out. Please try again.")

        except httpx.HTTPStatusError as e:
            logger.error(f"n8n returned HTTP {e.response.status_code}: {e.response.text}")
            raise N8NServiceError(f"Workflow engine error: {e.response.status_code}")

        data = response.json()
        logger.success(f"n8n responded OK | word_count={data.get('word_count', '?')}")

        return BlogResponse(
            blog=data["blog"],
            word_count=data.get("word_count", len(data["blog"].split())),
            sources=data.get("sources", []),
            generated_at=datetime.now(tz=timezone.utc),
        )
```

---

## Custom Exceptions

```python
# app/core/exceptions.py

class N8NServiceError(Exception):
    """Raised when n8n returns a non-2xx response."""
    pass

class N8NTimeoutError(Exception):
    """Raised when n8n does not respond within the configured timeout."""
    pass
```

---

## Routes

```python
# app/api/v1/routes/blog.py
from fastapi import APIRouter, Request, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models.request import BlogRequest
from app.models.response import BlogResponse, ErrorResponse
from app.services.n8n_service import N8NService
from app.dependencies import get_n8n_service
from app.core.exceptions import N8NServiceError, N8NTimeoutError
from fastapi import HTTPException
from loguru import logger

router = APIRouter(prefix="/blog", tags=["Blog"])
limiter = Limiter(key_func=get_remote_address)

@router.post(
    "/generate",
    response_model=BlogResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
        502: {"model": ErrorResponse, "description": "n8n workflow error"},
        504: {"model": ErrorResponse, "description": "n8n workflow timed out"},
    },
    summary="Generate a blog post",
    description="Triggers the n8n workflow which searches the web via Tavily and generates a blog using Groq LLM.",
)
@limiter.limit("10/minute")
async def generate_blog(
    request: Request,              # Required by slowapi rate limiter
    body: BlogRequest,
    n8n: N8NService = Depends(get_n8n_service),
):
    try:
        result = await n8n.generate_blog(body)
        return result

    except N8NTimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))

    except N8NServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))

    except Exception as e:
        logger.exception("Unexpected error during blog generation")
        raise HTTPException(status_code=500, detail="Unexpected error. Please try again.")
```

```python
# app/api/v1/routes/health.py
from fastapi import APIRouter
from datetime import datetime, timezone
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health", summary="Health check")
async def health():
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "env": settings.APP_ENV,
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
    }
```

---

## Dependencies (Shared)

```python
# app/dependencies.py
import httpx
from fastapi import Request
from app.services.n8n_service import N8NService

def get_n8n_service(request: Request) -> N8NService:
    """Injects N8NService with the shared httpx.AsyncClient from app state."""
    return N8NService(client=request.app.state.http_client)
```

---

## Main App Entry Point

```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import httpx
from loguru import logger

from app.config import settings
from app.core.logging import setup_logging
from app.api.v1.routes import blog, health

# --- Logging ---
setup_logging()

# --- Rate limiter ---
limiter = Limiter(key_func=get_remote_address, default_limits=["100/hour"])

# --- Lifespan: manage httpx client lifecycle ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — creating shared httpx client")
    app.state.http_client = httpx.AsyncClient()
    yield
    logger.info("Shutting down — closing httpx client")
    await app.state.http_client.aclose()

# --- App ---
app = FastAPI(
    title="Blog Generator API",
    description="AI-powered blog generation using n8n, Tavily, and Groq.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# --- Rate limit exceeded handler ---
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please wait a minute and try again."},
    )

# --- Routers ---
app.include_router(health.router, prefix="/api/v1")
app.include_router(blog.router, prefix="/api/v1")
```

---

## Logging Setup

```python
# app/core/logging.py
import sys
from loguru import logger

def setup_logging():
    logger.remove()  # Remove default handler
    logger.add(
        sys.stdout,
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | {message}",
        level="INFO",
    )
```

---

## n8n Workflow — What it Receives and Returns

### What FastAPI sends to n8n (POST body):
```json
{
  "title": "The Future of AI in Healthcare 2025",
  "keywords": ["ai", "healthcare", "machine learning"],
  "target_audience": "Software developers and startup founders",
  "tone": "professional",
  "length": "medium",
  "language": "english",
  "additional_context": null
}
```

### What n8n must return to FastAPI:
```json
{
  "blog": "## The Future of AI in Healthcare\n\n...(full markdown)...",
  "word_count": 1024,
  "sources": [
    "https://example.com/ai-healthcare-2025",
    "https://another.com/ml-in-medicine"
  ]
}
```

n8n nodes in order:
1. **Webhook trigger** — receives the POST from FastAPI, starts workflow
2. **Tavily Search node** (HTTP Request) — searches `{title} {keywords}` for latest web data
3. **Code node** — extracts and formats search results as context string
4. **HTTP Request node → Groq API** — sends structured prompt with context + user inputs
5. **Code node** — extracts blog text, counts words, assembles final JSON
6. **Respond to Webhook node** — sends final JSON back to FastAPI

---

## Environment Variables

```bash
# .env (local dev — never commit)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/generate-blog
N8N_WEBHOOK_SECRET=your-random-secret-here

APP_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

RATE_LIMIT_PER_MINUTE=10
N8N_TIMEOUT_SECONDS=120
```

```bash
# .env.example (committed to GitHub)
N8N_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=

APP_ENV=production
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app

RATE_LIMIT_PER_MINUTE=10
N8N_TIMEOUT_SECONDS=120
```

---

## Deployment — Render (Free)

**render.yaml** — Infrastructure-as-code for one-click deploy:
```yaml
services:
  - type: web
    name: blog-generator-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: APP_ENV
        value: production
      - key: N8N_WEBHOOK_URL
        sync: false          # Set manually in Render dashboard
      - key: N8N_WEBHOOK_SECRET
        sync: false          # Set manually in Render dashboard
      - key: ALLOWED_ORIGINS
        sync: false          # Your Vercel frontend URL
```

Run locally:
```bash
uvicorn app.main:app --reload --port 8000
```

Swagger UI available at: `http://localhost:8000/docs`

---

## n8n Self-Hosting — Railway (Free)

Railway free tier gives $5 credit/month which easily covers a lightweight n8n container.

```bash
# railway.toml in a separate n8n deployment folder
[build]
  dockerfilePath = "Dockerfile.n8n"

# Or use Railway's one-click n8n template:
# https://railway.app/template/n8n
```

Simpler: use Railway's official n8n template (one-click deploy), then:
1. Set `N8N_BASIC_AUTH_ACTIVE=true` + `N8N_BASIC_AUTH_USER` + `N8N_BASIC_AUTH_PASSWORD`
2. Set `N8N_HOST` to your Railway domain
3. Copy the webhook URL from your n8n trigger node
4. Paste it as `N8N_WEBHOOK_URL` in your Render backend env vars

---

## API Reference Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check — returns status, version, timestamp |
| `POST` | `/api/v1/blog/generate` | Generate blog — validates input, triggers n8n |
| `GET` | `/docs` | Swagger UI (auto-generated) |
| `GET` | `/redoc` | ReDoc UI (auto-generated) |

---

## Best Practices Checklist

- All settings loaded from env via `pydantic-settings` — zero hardcoded values
- `httpx.AsyncClient` created once at startup and shared — not recreated per request
- n8n logic fully isolated in `N8NService` — routes stay thin
- Custom exceptions map clearly to HTTP status codes (502 = n8n error, 504 = timeout)
- Rate limiting applied per-IP with `slowapi` — prevents abuse on free tier
- CORS restricted to specific frontend origin in production
- Loguru provides structured, colored logs — easy to read on Render dashboard
- Swagger + ReDoc auto-generated from Pydantic models — no manual API docs needed
- `render.yaml` committed so the project is one-click deployable
- `.env.example` committed so collaborators know exactly which keys to set
- Timeout set to 120s to handle slow LLM + web search chains without hanging
