"""Add 'purchase' to stock_movements type CHECK (billing).

Revision ID: 006_billing_stock_purchase
Revises: 005_billing_product_type
Create Date: 2026-03-11

Drops and recreates stock_movements_type_check to include 'purchase'.
Skips if stock_movements table does not exist (e.g. teaching DB).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006_billing_stock_purchase"
down_revision: Union[str, None] = "005_billing_product_type"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _stock_movements_exists(connection) -> bool:
    result = connection.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements'"
        )
    )
    return result.scalar() is not None


def upgrade() -> None:
    connection = op.get_bind()
    if not _stock_movements_exists(connection):
        return
    op.drop_constraint(
        "stock_movements_type_check",
        "stock_movements",
        type_="check",
        schema="public",
    )
    op.create_check_constraint(
        "stock_movements_type_check",
        "stock_movements",
        "type IN ('opening', 'production', 'purchase', 'sale', 'adjustment')",
        schema="public",
    )


def downgrade() -> None:
    connection = op.get_bind()
    if not _stock_movements_exists(connection):
        return
    op.drop_constraint(
        "stock_movements_type_check",
        "stock_movements",
        type_="check",
        schema="public",
    )
    op.create_check_constraint(
        "stock_movements_type_check",
        "stock_movements",
        "type IN ('opening', 'production', 'sale', 'adjustment')",
        schema="public",
    )
