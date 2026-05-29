from datetime import datetime, timezone

import httpx
from loguru import logger

from app.config import settings
from app.core.exceptions import N8NServiceError, N8NTimeoutError
from app.models.request import BlogRequest
from app.models.response import BlogResponse


class N8NService:
    """Calls the n8n webhook and maps the response to BlogResponse."""

    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.webhook_url = settings.N8N_WEBHOOK_URL
        self.secret = settings.N8N_WEBHOOK_SECRET

    async def generate_blog(self, request: BlogRequest) -> BlogResponse:
        if not self.webhook_url or not self.secret:
            raise N8NServiceError(
                "n8n is not configured. Set N8N_WEBHOOK_URL and N8N_WEBHOOK_SECRET."
            )

        payload = {
            "title": request.title,
            "primary_keywords": request.primary_keywords,
            "secondary_keywords": request.secondary_keywords,
            "target_audience": request.target_audience,
            "tone": request.tone.value,
            "length": request.length.value,
            "language": request.language.value,
            "additional_context": request.additional_context,
        }

        logger.info(
            f"Triggering n8n webhook | title='{request.title}' "
            f"tone={request.tone.value} primary_keywords={request.primary_keywords}"
        )

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

        blog_text = data["blog"]
        return BlogResponse(
            blog=blog_text,
            word_count=data.get("word_count", len(blog_text.split())),
            sources=data.get("sources", []),
            generated_at=datetime.now(tz=timezone.utc),
        )
