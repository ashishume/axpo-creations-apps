"""FastAPI application entry point."""
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.core.middleware import setup_middleware
from app.core.exceptions import AppException, app_exception_handler
from app.billing.router import router as billing_router
from app.teaching.router import router as teaching_router

logger = logging.getLogger(__name__)

API_VERSION = "0.1.0"

app = FastAPI(
    title="Start Tech API",
    description="Backend for Billing and Teaching applications",
    version=API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_exception_handler(AppException, app_exception_handler)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    """Map DB constraint violations to 409 Conflict."""
    logger.warning("IntegrityError: %s", exc)
    msg = "A database constraint was violated (e.g. duplicate or invalid reference)."
    orig = str(exc.orig) if getattr(exc, "orig", None) else str(exc)
    if "unique" in orig.lower() or "duplicate" in orig.lower():
        msg = "A record with this value already exists."
    return JSONResponse(
        status_code=409,
        content={"detail": msg},
    )


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


@app.get("/")
async def root():
    """Welcome message and quick links."""
    return {
        "message": "Welcome to Start Tech API — Billing & Teaching backends.",
        "version": API_VERSION,
        "docs": "/docs",
        "billing_api": "/billing/api/v1",
        "teaching_api": "/teaching/api/v1",
        "health": "/health",
        "health_db": "/health/db",
    }


@app.on_event("startup")
async def startup_log():
    """Log Supabase Storage config and verify DB connections."""
    from sqlalchemy import text

    from app.core.database import get_billing_session_factory, get_teaching_session_factory

    s = get_settings()

    # Database connection checks
    try:
        factory = get_billing_session_factory()
        async with factory() as session:
            await session.execute(text("SELECT 1"))
        logger.info("Database connected: billing")
    except Exception as e:
        logger.error("Database connection failed: billing — %s", e)

    try:
        factory = get_teaching_session_factory()
        async with factory() as session:
            await session.execute(text("SELECT 1"))
        logger.info("Database connected: teaching")
    except Exception as e:
        logger.error("Database connection failed: teaching — %s", e)

    # Supabase Storage
    if s.TEACHING_SUPABASE_URL and s.TEACHING_SUPABASE_SERVICE_ROLE_KEY:
        logger.info(
            "Supabase Storage enabled: uploads (student photos, receipts) will use %s",
            s.TEACHING_SUPABASE_URL.rstrip("/"),
        )
    else:
        logger.info(
            "Supabase Storage not configured: uploads will use local %s (set TEACHING_SUPABASE_URL and TEACHING_SUPABASE_SERVICE_ROLE_KEY to use Supabase)",
            s.UPLOAD_DIR,
        )


@app.get("/health")
async def health():
    """Liveness probe — process is up (use /health/db for database checks)."""
    return {
        "status": "ok",
        "service": "start-tech-api",
        "version": API_VERSION,
    }


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
