"""add list pagination indexes (teaching)

Revision ID: 003_list_indexes
Revises: 002_org_sub
Create Date: 2026-03-10

"""
from typing import Sequence, Union

from alembic import op

revision: str = "003_list_indexes"
down_revision: Union[str, None] = "002_org_sub"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_school_xx_students_session_created",
        "school_xx_students",
        ["session_id", "created_at"],
        postgresql_ops={"created_at": "DESC"},
    )
    op.create_index(
        "ix_school_xx_staff_session_created",
        "school_xx_staff",
        ["session_id", "created_at"],
        postgresql_ops={"created_at": "DESC"},
    )
    op.create_index(
        "ix_school_xx_expenses_session_date",
        "school_xx_expenses",
        ["session_id", "date"],
        postgresql_ops={"date": "DESC"},
    )
    op.create_index(
        "ix_school_xx_stocks_session_created",
        "school_xx_stocks",
        ["session_id", "created_at"],
        postgresql_ops={"created_at": "DESC"},
    )
    op.create_index(
        "ix_school_xx_leave_requests_session_applied",
        "school_xx_leave_requests",
        ["session_id", "applied_at"],
        postgresql_ops={"applied_at": "DESC"},
    )
    op.create_index(
        "ix_school_xx_fee_payments_student_date",
        "school_xx_fee_payments",
        ["student_id", "date"],
        postgresql_ops={"date": "DESC"},
    )


def downgrade() -> None:
    op.drop_index("ix_school_xx_fee_payments_student_date", table_name="school_xx_fee_payments")
    op.drop_index("ix_school_xx_leave_requests_session_applied", table_name="school_xx_leave_requests")
    op.drop_index("ix_school_xx_stocks_session_created", table_name="school_xx_stocks")
    op.drop_index("ix_school_xx_expenses_session_date", table_name="school_xx_expenses")
    op.drop_index("ix_school_xx_staff_session_created", table_name="school_xx_staff")
    op.drop_index("ix_school_xx_students_session_created", table_name="school_xx_students")
