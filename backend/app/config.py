"""Application configuration from environment."""
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _ensure_async_driver(url: str) -> str:
    """Ensure Postgres URL uses async driver (asyncpg). Required for create_async_engine."""
    if url.startswith("postgresql://") and "+" not in url.split("://", 1)[0]:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


class Settings(BaseSettings):
    """Settings loaded from environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        env_ignore_empty=True,
    )

    BILLING_DATABASE_URL: str
    TEACHING_DATABASE_URL: str

    @field_validator("BILLING_DATABASE_URL", "TEACHING_DATABASE_URL", mode="after")
    @classmethod
    def normalize_db_url(cls, v: str) -> str:
        return _ensure_async_driver(v)

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Session duration: refresh token (and HTTP-only cookie) expire after this many days.
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    COOKIE_SECURE: bool = True
    COOKIE_DOMAIN: str | None = None

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://school.axpocreation.com,https://billing.axpocreation.com"


def get_settings() -> Settings:
    """Return application settings."""
    return Settings()
