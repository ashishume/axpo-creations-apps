"""add sessions:create permission (teaching)

Revision ID: 004_sessions_create
Revises: 003_add_list_indexes
Create Date: 2026-03-10

School creation stays Super Admin only (schools:create).
Session creation is allowed for school admins (sessions:create).
"""
from typing import Sequence, Union

from alembic import op

revision: str = "004_sessions_create"
down_revision: Union[str, None] = "003_list_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SUPER_ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000000"
ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000001"


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO school_xx_permissions (id, module, action, description)
        VALUES ('sessions:create', 'sessions', 'create', 'Create sessions (school admins)')
        ON CONFLICT (id) DO NOTHING
        """
    )
    op.execute(
        f"""
        INSERT INTO school_xx_role_permissions (role_id, permission_id)
        VALUES
          ('{SUPER_ADMIN_ROLE_ID}', 'sessions:create'),
          ('{ADMIN_ROLE_ID}', 'sessions:create')
        ON CONFLICT (role_id, permission_id) DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM school_xx_role_permissions WHERE permission_id = 'sessions:create'
        """
    )
    op.execute(
        """
        DELETE FROM school_xx_permissions WHERE id = 'sessions:create'
        """
    )
