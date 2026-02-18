"""FastAPI application entry point."""
from fastapi import FastAPI

from app.config import get_settings
from app.core.middleware import setup_middleware
from app.core.exceptions import AppException, app_exception_handler
from app.billing.router import router as billing_router
from app.teaching.router import router as teaching_router

app = FastAPI(
    title="Start Tech API",
    description="Backend for Billing and Teaching applications",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_exception_handler(AppException, app_exception_handler)
setup_middleware(app)

app.include_router(billing_router, prefix="/billing/api/v1", tags=["billing"])
app.include_router(teaching_router, prefix="/teaching/api/v1", tags=["teaching"])


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/health/db")
async def health_db():
    """Check connectivity to Billing and Teaching databases (Supabase/Postgres)."""
    from sqlalchemy import text
    from app.core.database import get_billing_session_factory, get_teaching_session_factory

    result = {"billing": "unknown", "teaching": "unknown", "ok": False}

    try:
        factory = get_billing_session_factory()
        async with factory() as session:
            await session.execute(text("SELECT 1"))
        result["billing"] = "connected"
    except Exception as e:
        result["billing"] = f"error: {e!s}"

    try:
        factory = get_teaching_session_factory()
        async with factory() as session:
            await session.execute(text("SELECT 1"))
        result["teaching"] = "connected"
    except Exception as e:
        result["teaching"] = f"error: {e!s}"

    result["ok"] = result["billing"] == "connected" and result["teaching"] == "connected"
    return result
