from datetime import datetime

from pydantic import BaseModel


class BlogResponse(BaseModel):
    blog: str
    word_count: int
    sources: list[str] = []
    generated_at: datetime


class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None
