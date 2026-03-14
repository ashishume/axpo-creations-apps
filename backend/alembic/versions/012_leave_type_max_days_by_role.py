"""add max_days_by_role to leave_types (teaching)

Revision ID: 012_leave_type_max_days_by_role
Revises: 011_fees_salary_record
Create Date: 2026-03-14

Allows different max leave days per staff role per leave type.
"""
from typing import Sequence, Union

from alembic import op

revision: str = "012_leave_type_max_days_by_role"
down_revision: Union[str, None] = "011_fees_salary_record"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE leave_types
          ADD COLUMN IF NOT EXISTS max_days_by_role JSONB
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE leave_types
          DROP COLUMN IF EXISTS max_days_by_role
        """
    )
