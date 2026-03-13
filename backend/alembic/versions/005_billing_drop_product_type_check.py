"""Drop product_type CHECK constraint (billing). Allow any product type string.

Revision ID: 005_billing_product_type
Revises: 004_sessions_create
Create Date: 2026-03-11

Safe to run on billing DB: drops products_product_type_check if present.
On teaching DB, products table does not exist so we skip.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "005_billing_product_type"
down_revision: Union[str, None] = "004_sessions_create"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _products_table_exists(connection) -> bool:
    result = connection.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products'"
        )
    )
    return result.scalar() is not None


def upgrade() -> None:
    connection = op.get_bind()
    if _products_table_exists(connection):
        # Drop only if constraint exists (idempotent for DBs where it was never created or already dropped)
        connection.execute(
            sa.text("ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_product_type_check")
        )


def downgrade() -> None:
    connection = op.get_bind()
    if _products_table_exists(connection):
        op.create_check_constraint(
            "products_product_type_check",
            "products",
            "product_type IN ('Red Clay Bricks', 'Fly Ash Bricks', 'Wire Cut Bricks', 'Concrete Blocks')",
            schema="public",
        )
