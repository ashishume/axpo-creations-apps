"""add org_subscriptions table (teaching)

Revision ID: 002_org_sub
Revises: 001_subscription
Create Date: 2026-03-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_org_sub"
down_revision: Union[str, None] = "001_subscription"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "school_xx_org_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("school_xx_organizations.id"),
            nullable=False,
        ),
        sa.Column("plan_type", sa.String(20), nullable=False, server_default="starter"),
        sa.Column("billing_interval", sa.String(20), nullable=False, server_default="monthly"),
        sa.Column("status", sa.String(20), nullable=False, server_default="inactive"),
        sa.Column("is_locked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("razorpay_subscription_id", sa.Text(), nullable=True),
        sa.Column("razorpay_payment_id", sa.Text(), nullable=True),
        sa.Column("razorpay_customer_id", sa.Text(), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_unique_constraint(
        "uq_school_xx_org_subscriptions_organization_id",
        "school_xx_org_subscriptions",
        ["organization_id"],
    )
    op.create_index(
        "ix_school_xx_org_subscriptions_razorpay_subscription_id",
        "school_xx_org_subscriptions",
        ["razorpay_subscription_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_school_xx_org_subscriptions_razorpay_subscription_id",
        table_name="school_xx_org_subscriptions",
    )
    op.drop_constraint(
        "uq_school_xx_org_subscriptions_organization_id",
        "school_xx_org_subscriptions",
        type_="unique",
    )
    op.drop_table("school_xx_org_subscriptions")
