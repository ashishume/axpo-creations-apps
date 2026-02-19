"""FastAPI application entry point."""
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.core.middleware import setup_middleware
from app.core.exceptions import AppException, app_exception_handler
from app.billing.router import router as billing_router
from app.teaching.router import router as teaching_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Start Tech API",
    description="Backend for Billing and Teaching applications",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_exception_handler(AppException, app_exception_handler)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Return 500 with error detail; 503 when DB is unreachable (deployment/network)."""
    logger.exception("Unhandled exception")
    msg = str(exc)
    # DB unreachable from container (e.g. TEACHING_DATABASE_URL uses host container can't reach)
    if "Network is unreachable" in msg or "Connection refused" in msg or "Name or service not known" in msg:
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Database is unreachable. Ensure BILLING_DATABASE_URL and TEACHING_DATABASE_URL are reachable from this container (use DB host IP/name, not localhost).",
                "error": msg,
            },
        )
    return JSONResponse(
        status_code=500,
        content={"detail": msg},
    )


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
