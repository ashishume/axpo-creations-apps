"""Database engine and session management for multiple databases."""
import ssl
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

# Supabase (and most cloud Postgres) require SSL; use a default context for server verification
_ssl_context = ssl.create_default_context()
# Supabase uses a cert that may not match the pooler hostname; allow for that
_ssl_context.check_hostname = False
_ssl_context.verify_mode = ssl.CERT_NONE


class Base(DeclarativeBase):
    """Shared base; prefer BillingBase/TeachingBase for domain models."""

    pass


class BillingBase(DeclarativeBase):
    """Declarative base for billing domain. All billing models inherit this."""

    pass


class TeachingBase(DeclarativeBase):
    """Declarative base for teaching domain. All teaching models inherit this."""

    pass


def create_engine_for_url(url: str):
    """Create async engine for a given database URL. Uses SSL for Supabase/cloud Postgres.
    statement_cache_size=0 is required when using PgBouncer (e.g. Supabase pooler) in
    transaction or statement mode, which does not support prepared statements."""
    return create_async_engine(
        url,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args={
            "ssl": _ssl_context,
            "statement_cache_size": 0,
        },
    )


def get_billing_engine():
    """Get async engine for billing database."""
    settings = get_settings()
    return create_engine_for_url(settings.BILLING_DATABASE_URL)


def get_teaching_engine():
    """Get async engine for teaching database."""
    settings = get_settings()
    return create_engine_for_url(settings.TEACHING_DATABASE_URL)


# Lazy engine/session factory per domain (created on first use)
_billing_engine = None
_teaching_engine = None

_billing_session_factory: async_sessionmaker[AsyncSession] | None = None
_teaching_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_billing_session_factory() -> async_sessionmaker[AsyncSession]:
    """Get async session factory for billing DB."""
    global _billing_engine, _billing_session_factory
    if _billing_session_factory is None:
        _billing_engine = get_billing_engine()
        _billing_session_factory = async_sessionmaker(
            _billing_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _billing_session_factory


def get_teaching_session_factory() -> async_sessionmaker[AsyncSession]:
    """Get async session factory for teaching DB."""
    global _teaching_engine, _teaching_session_factory
    if _teaching_session_factory is None:
        _teaching_engine = get_teaching_engine()
        _teaching_session_factory = async_sessionmaker(
            _teaching_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _teaching_session_factory


@asynccontextmanager
async def get_billing_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield billing DB session. Use in FastAPI dependency."""
    factory = get_billing_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_teaching_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield teaching DB session. Use in FastAPI dependency."""
    factory = get_teaching_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
