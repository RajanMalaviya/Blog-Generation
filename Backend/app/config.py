from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    N8N_WEBHOOK_URL: str = ""
    N8N_WEBHOOK_SECRET: str = ""

    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"

    ALLOWED_ORIGINS: str = "http://localhost:5173"

    RATE_LIMIT_PER_MINUTE: int = 10
    N8N_TIMEOUT_SECONDS: int = 120

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
