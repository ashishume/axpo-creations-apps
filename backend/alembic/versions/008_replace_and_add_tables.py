"""Replace old table and add new tables (billing).

Revision ID: 008_replace_and_add_tables
Revises: 007_billing_suppliers_purchases
Create Date: 2026-03-11

Example: drop an existing table (replace), then create new table(s).
Adjust OLD_TABLE_NAME and new table definitions to your case.
Skips if not on billing DB (products table exists).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "008_replace_and_add_tables"
down_revision: Union[str, None] = "007_billing_suppliers_purchases"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Set to the table you want to replace (drop). Use None to skip replace step.
OLD_TABLE_TO_REPLACE = "legacy_suppliers"  # or e.g. "old_orders"


def _table_exists(connection, table_name: str) -> bool:
    result = connection.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = :name"
        ),
        {"name": table_name},
    )
    return result.scalar() is not None


def _products_table_exists(connection) -> bool:
    return _table_exists(connection, "products")


def upgrade() -> None:
    connection = op.get_bind()
    if not _products_table_exists(connection):
        return

    # --- REPLACE: drop existing table (and dependent objects) ---
    if OLD_TABLE_TO_REPLACE and _table_exists(connection, OLD_TABLE_TO_REPLACE):
        op.drop_table(OLD_TABLE_TO_REPLACE, schema="public")

    # --- ADD: create new table(s) ---
    # Only create if not already present (e.g. from 007 or manual run)
    if not _table_exists(connection, "new_entity"):
        op.create_table(
            "new_entity",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("name", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            schema="public",
        )


def downgrade() -> None:
    connection = op.get_bind()
    if not _products_table_exists(connection):
        return

    # Drop new table(s) first
    if _table_exists(connection, "new_entity"):
        op.drop_table("new_entity", schema="public")

    # Recreate old table if we had dropped it (optional; restore with minimal columns)
    if OLD_TABLE_TO_REPLACE and not _table_exists(connection, OLD_TABLE_TO_REPLACE):
        op.create_table(
            OLD_TABLE_TO_REPLACE,
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("name", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            schema="public",
        )
