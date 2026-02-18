"""Alembic environment. Set TARGET_DB=billing or TARGET_DB=teaching to run migrations for that DB."""
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from app.config import get_settings

# Import all models so metadata is populated
from app.billing.models import BillingBase  # noqa: F401
from app.billing import models as billing_models  # noqa: F401
from app.teaching.models import TeachingBase  # noqa: F401
from app.teaching import models as teaching_models  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_db = os.environ.get("TARGET_DB", "billing").lower()
if target_db not in ("billing", "teaching"):
    raise ValueError("TARGET_DB must be 'billing' or 'teaching'")

settings = get_settings()
# Use sync driver for Alembic (postgresql+psycopg2)
if target_db == "billing":
    config.set_main_option(
        "sqlalchemy.url",
        settings.BILLING_DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2"),
    )
    target_metadata = BillingBase.metadata
else:
    config.set_main_option(
        "sqlalchemy.url",
        settings.TEACHING_DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2"),
    )
    target_metadata = TeachingBase.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (sync for simplicity with Alembic)."""
    from sqlalchemy import create_engine

    url = config.get_main_option("sqlalchemy.url")
    connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        do_run_migrations(connection)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
