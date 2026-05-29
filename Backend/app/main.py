from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.routes import blog, health
from app.config import settings
from app.core.limiter import limiter
from app.core.logging import setup_logging

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — creating shared httpx client")
    app.state.http_client = httpx.AsyncClient()
    yield
    logger.info("Shutting down — closing httpx client")
    await app.state.http_client.aclose()


app = FastAPI(
    title="Blog Generator API",
    description="AI-powered blog generation using n8n, Tavily, and Groq.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
limiter.default_limits = ["100/hour"]
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


app.include_router(health.router, prefix="/api/v1")
app.include_router(blog.router, prefix="/api/v1")
