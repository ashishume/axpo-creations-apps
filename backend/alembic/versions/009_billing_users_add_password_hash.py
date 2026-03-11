"""Add password_hash to users table (billing).

Revision ID: 009_billing_users_password_hash
Revises: 008_replace_and_add_tables
Create Date: 2026-03-11

Adds password_hash column to users when missing (e.g. DB created from Supabase schema).
Skips if users table or column already has password_hash.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "009_billing_users_password_hash"
down_revision: Union[str, None] = "008_replace_and_add_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(connection, table_name: str) -> bool:
    result = connection.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = :name"
        ),
        {"name": table_name},
    )
    return result.scalar() is not None


def _column_exists(connection, table_name: str, column_name: str) -> bool:
    result = connection.execute(
        sa.text(
            "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = :t AND column_name = :c"
        ),
        {"t": table_name, "c": column_name},
    )
    return result.scalar() is not None


def upgrade() -> None:
    connection = op.get_bind()
    if not _table_exists(connection, "users"):
        return
    if _column_exists(connection, "users", "password_hash"):
        return
    op.add_column("users", sa.Column("password_hash", sa.Text(), nullable=True), schema="public")


def downgrade() -> None:
    connection = op.get_bind()
    if not _table_exists(connection, "users"):
        return
    if not _column_exists(connection, "users", "password_hash"):
        return
    op.drop_column("users", "password_hash", schema="public")
