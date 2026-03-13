"""Add suppliers and purchase_invoices tables (billing).

Revision ID: 007_billing_suppliers_purchases
Revises: 006_billing_stock_purchase
Create Date: 2026-03-11

Creates suppliers, purchase_invoices, purchase_invoice_items.
Skips if not on billing DB (products table exists).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "007_billing_suppliers_purchases"
down_revision: Union[str, None] = "006_billing_stock_purchase"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _products_table_exists(connection) -> bool:
    result = connection.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products'"
        )
    )
    return result.scalar() is not None


def _table_exists(connection, table_name: str) -> bool:
    result = connection.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = :name"
        ),
        {"name": table_name},
    )
    return result.scalar() is not None


def upgrade() -> None:
    connection = op.get_bind()
    if not _products_table_exists(connection):
        return

    if not _table_exists(connection, "suppliers"):
        op.create_table(
            "suppliers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("phone", sa.Text(), nullable=True),
        sa.Column("gstin", sa.Text(), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("state_code", sa.Text(), nullable=True),
        sa.Column("opening_balance", sa.Numeric(), server_default="0", nullable=False),
        sa.Column("credit_days", sa.Integer(), server_default="0", nullable=False),
        sa.Column("credit_limit", sa.Numeric(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    if not _table_exists(connection, "purchase_invoices"):
        op.create_table(
            "purchase_invoices",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("number", sa.Text(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("supplier_id", UUID(as_uuid=True), sa.ForeignKey("suppliers.id"), nullable=True),
        sa.Column("subtotal", sa.Numeric(), server_default="0", nullable=False),
        sa.Column("discount", sa.Numeric(), nullable=True),
        sa.Column("taxable_amount", sa.Numeric(), server_default="0", nullable=False),
        sa.Column("cgst_amount", sa.Numeric(), nullable=True),
        sa.Column("sgst_amount", sa.Numeric(), nullable=True),
        sa.Column("igst_amount", sa.Numeric(), nullable=True),
        sa.Column("round_off", sa.Numeric(), nullable=True),
        sa.Column("total", sa.Numeric(), server_default="0", nullable=False),
        sa.Column("total_in_words", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), server_default="final", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_unique_constraint("uq_purchase_invoices_number", "purchase_invoices", ["number"])

    if not _table_exists(connection, "purchase_invoice_items"):
        op.create_table(
            "purchase_invoice_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("purchase_invoice_id", UUID(as_uuid=True), sa.ForeignKey("purchase_invoices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=True),
        sa.Column("quantity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("rate", sa.Numeric(), server_default="0", nullable=False),
        sa.Column("discount", sa.Numeric(), nullable=True),
        sa.Column("line_total", sa.Numeric(), server_default="0", nullable=False),
        sa.Column("taxable_amount", sa.Numeric(), nullable=True),
        sa.Column("gst_amount", sa.Numeric(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )


def downgrade() -> None:
    connection = op.get_bind()
    if not _products_table_exists(connection):
        return
    op.drop_table("purchase_invoice_items")
    op.drop_table("purchase_invoices")
    op.drop_table("suppliers")
