"""add aadhaar, dob, admission_number, sibling_discount, frozen fields

Revision ID: 013_student_staff_fields
Revises: 012_leave_type_max_days_by_role
Create Date: 2026-03-14

Adds:
- Student: aadhaar_number, date_of_birth, admission_number, has_sibling_discount, is_frozen, frozen_at
- Staff: aadhaar_number, date_of_birth
- Updates default allowed_leaves from 2 to 1
"""
from typing import Sequence, Union

from alembic import op

revision: str = "013_student_staff_fields"
down_revision: Union[str, None] = "012_leave_type_max_days_by_role"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new fields to students
    op.execute(
        """
        ALTER TABLE students
          ADD COLUMN IF NOT EXISTS admission_number VARCHAR(50),
          ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12),
          ADD COLUMN IF NOT EXISTS date_of_birth DATE,
          ADD COLUMN IF NOT EXISTS has_sibling_discount BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ
        """
    )
    
    # Add new fields to staff
    op.execute(
        """
        ALTER TABLE staff
          ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12),
          ADD COLUMN IF NOT EXISTS date_of_birth DATE
        """
    )
    
    # Update default allowed_leaves_per_month from 2 to 1 for staff
    op.execute(
        """
        ALTER TABLE staff
          ALTER COLUMN allowed_leaves_per_month SET DEFAULT 1
        """
    )
    
    # Update default allowed_leaves from 2 to 1 for salary_payments
    op.execute(
        """
        ALTER TABLE salary_payments
          ALTER COLUMN allowed_leaves SET DEFAULT 1
        """
    )


def downgrade() -> None:
    # Remove new fields from students
    op.execute(
        """
        ALTER TABLE students
          DROP COLUMN IF EXISTS admission_number,
          DROP COLUMN IF EXISTS aadhaar_number,
          DROP COLUMN IF EXISTS date_of_birth,
          DROP COLUMN IF EXISTS has_sibling_discount,
          DROP COLUMN IF EXISTS is_frozen,
          DROP COLUMN IF EXISTS frozen_at
        """
    )
    
    # Remove new fields from staff
    op.execute(
        """
        ALTER TABLE staff
          DROP COLUMN IF EXISTS aadhaar_number,
          DROP COLUMN IF EXISTS date_of_birth
        """
    )
    
    # Revert default allowed_leaves_per_month back to 2
    op.execute(
        """
        ALTER TABLE staff
          ALTER COLUMN allowed_leaves_per_month SET DEFAULT 2
        """
    )
    
    # Revert default allowed_leaves back to 2
    op.execute(
        """
        ALTER TABLE salary_payments
          ALTER COLUMN allowed_leaves SET DEFAULT 2
        """
    )
