from fastapi import APIRouter, Depends, HTTPException, Request
from loguru import logger
from app.config import settings
from app.core.exceptions import N8NServiceError, N8NTimeoutError
from app.core.limiter import limiter
from app.dependencies import get_n8n_service
from app.models.request import BlogRequest
from app.models.response import BlogResponse, ErrorResponse
from app.services.n8n_service import N8NService

router = APIRouter(prefix="/blog", tags=["Blog"])


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
    description=(
        "Triggers the n8n workflow which searches the web via Tavily "
        "and generates a blog using Groq LLM."
    ),
)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def generate_blog(
    request: Request,
    body: BlogRequest,
    n8n: N8NService = Depends(get_n8n_service),
):
    try:
        return await n8n.generate_blog(body)
    except N8NTimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e)) from e
    except N8NServiceError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    except Exception:
        logger.exception("Unexpected error during blog generation")
        raise HTTPException(
            status_code=500,
            detail="Unexpected error. Please try again.",
        ) from None
