"""add fees:record and salary:record permissions (teaching)

Revision ID: 011_fees_salary_record
Revises: 010_billing_users_drop_auth_fk
Create Date: 2026-03-14

fees:record - Record fee payments only (cannot change fee structure / enrollment amounts).
salary:record - Record salary payments only (cannot change staff monthly salary or staff details).
"""
from typing import Sequence, Union

from alembic import op

revision: str = "011_fees_salary_record"
down_revision: Union[str, None] = "010_billing_users_drop_auth_fk"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO school_xx_permissions (id, module, action, description)
        VALUES
          ('fees:record', 'fees', 'record', 'Record fee payments only (cannot change fee structure)'),
          ('salary:record', 'salary', 'record', 'Record salary payments only (cannot change staff salary)')
        ON CONFLICT (id) DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM school_xx_role_permissions WHERE permission_id IN ('fees:record', 'salary:record')
        """
    )
    op.execute(
        """
        DELETE FROM school_xx_permissions WHERE id IN ('fees:record', 'salary:record')
        """
    )
