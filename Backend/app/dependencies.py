import httpx
from fastapi import Request

from app.services.n8n_service import N8NService


def get_n8n_service(request: Request) -> N8NService:
    return N8NService(client=request.app.state.http_client)
