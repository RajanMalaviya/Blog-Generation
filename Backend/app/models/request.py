from enum import Enum

from pydantic import BaseModel, Field, field_validator


class ToneEnum(str, Enum):
    professional = "professional"
    conversational = "conversational"
    academic = "academic"
    humorous = "humorous"
    persuasive = "persuasive"


class LengthEnum(str, Enum):
    short = "short"
    medium = "medium"
    long = "long"


class LanguageEnum(str, Enum):
    english = "english"
    hindi = "hindi"
    spanish = "spanish"
    french = "french"
    german = "german"


def _normalize_keywords(keywords: list[str]) -> list[str]:
    return [kw.strip().lower() for kw in keywords if kw.strip()]


class BlogRequest(BaseModel):
    title: str = Field(
        ...,
        min_length=5,
        max_length=150,
        examples=["The Future of AI in Healthcare 2025"],
    )
    primary_keywords: list[str] = Field(
        ...,
        min_length=1,
        max_length=5,
        examples=[["ai", "healthcare"]],
    )
    secondary_keywords: list[str] = Field(
        default_factory=list,
        max_length=10,
        examples=[["machine learning", "diagnostics"]],
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
    additional_context: str | None = Field(default=None, max_length=500)

    @field_validator("primary_keywords", "secondary_keywords")
    @classmethod
    def normalize_keywords(cls, v: list[str]) -> list[str]:
        return _normalize_keywords(v)
