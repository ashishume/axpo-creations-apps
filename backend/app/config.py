"""Application configuration from environment."""
import json

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
        env_file=(".env", ".env.local", ".env.production"),
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

    # AI Assistant (OpenRouter)
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"

    # Razorpay (Teaching subscription)
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None
    RAZORPAY_PLAN_ID: str | None = None  # Legacy single plan; prefer RAZORPAY_PLAN_IDS
    RAZORPAY_PLAN_IDS: dict[str, str] | None = None  # From JSON env: {"starter_monthly": "plan_xxx", ...}
    RAZORPAY_WEBHOOK_SECRET: str | None = None

    @field_validator("RAZORPAY_PLAN_IDS", mode="before")
    @classmethod
    def parse_plan_ids(cls, v: str | None) -> dict[str, str] | None:
        if v is None or v == "":
            return None
        if isinstance(v, dict):
            return v
        try:
            return json.loads(v)
        except (json.JSONDecodeError, TypeError):
            return None

    def get_razorpay_plan_id(self, plan_type: str, billing_interval: str) -> str | None:
        """Return Razorpay plan ID for plan_type + billing_interval, or RAZORPAY_PLAN_ID fallback."""
        key = f"{plan_type}_{billing_interval}"
        if self.RAZORPAY_PLAN_IDS and key in self.RAZORPAY_PLAN_IDS:
            return self.RAZORPAY_PLAN_IDS[key]
        if billing_interval == "monthly" and self.RAZORPAY_PLAN_ID:
            return self.RAZORPAY_PLAN_ID
        return None

    # File uploads (student photos, receipt photos) – max 2MB per file
    UPLOAD_DIR: str = "uploads"
    UPLOAD_MAX_BYTES: int = 2 * 1024 * 1024  # 2MB

    # Optional: Supabase Storage for uploads (persists on Railway; set both to enable)
    TEACHING_SUPABASE_URL: str | None = None  # e.g. https://xxx.supabase.co
    TEACHING_SUPABASE_SERVICE_ROLE_KEY: str | None = None


def get_settings() -> Settings:
    """Return application settings."""
    return Settings()
