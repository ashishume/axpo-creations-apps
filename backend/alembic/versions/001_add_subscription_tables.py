"""add subscription tables (teaching)

Revision ID: 001_subscription
Revises: None
Create Date: 2026-03-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_subscription"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "school_xx_premium_coupons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("max_uses", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("used_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duration_days", sa.Integer(), nullable=False, server_default="365"),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_unique_constraint(
        "uq_school_xx_premium_coupons_code",
        "school_xx_premium_coupons",
        ["code"],
    )

    op.create_table(
        "school_xx_user_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("school_xx_users.id"), nullable=False),
        sa.Column("razorpay_subscription_id", sa.Text(), nullable=True),
        sa.Column("razorpay_payment_id", sa.Text(), nullable=True),
        sa.Column("plan_type", sa.String(20), nullable=False, server_default="free"),
        sa.Column("status", sa.String(20), nullable=False, server_default="inactive"),
        sa.Column("amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_unique_constraint(
        "uq_school_xx_user_subscriptions_user_id",
        "school_xx_user_subscriptions",
        ["user_id"],
    )
    op.create_index(
        "ix_school_xx_user_subscriptions_razorpay_subscription_id",
        "school_xx_user_subscriptions",
        ["razorpay_subscription_id"],
    )

    op.create_table(
        "school_xx_coupon_redemptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("school_xx_users.id"), nullable=False),
        sa.Column("user_email", sa.String(255), nullable=True),
        sa.Column("coupon_code", sa.Text(), nullable=False),
        sa.Column("coupon_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("school_xx_premium_coupons.id"), nullable=False),
        sa.Column("redeemed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("success", sa.Boolean(), nullable=False, server_default="true"),
    )


def downgrade() -> None:
    op.drop_table("school_xx_coupon_redemptions")
    op.drop_table("school_xx_user_subscriptions")
    op.drop_table("school_xx_premium_coupons")
