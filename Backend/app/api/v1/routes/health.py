from datetime import datetime, timezone

from fastapi import APIRouter

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
