"""Drop users.id FK to auth.users so backend can create users (billing).

Revision ID: 010_billing_users_drop_auth_fk
Revises: 009_billing_users_password_hash
Create Date: 2026-03-11

Drops the foreign key from public.users(id) to auth.users(id) when present,
so the backend can register users with its own UUIDs without Supabase Auth.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "010_billing_users_drop_auth_fk"
down_revision: Union[str, None] = "009_billing_users_password_hash"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _constraint_exists(connection, table_name: str, constraint_name: str) -> bool:
    result = connection.execute(
        sa.text(
            "SELECT 1 FROM information_schema.table_constraints "
            "WHERE table_schema = 'public' AND table_name = :t AND constraint_name = :c"
        ),
        {"t": table_name, "c": constraint_name},
    )
    return result.scalar() is not None


def _fk_to_auth_users(connection) -> str | None:
    """Return the constraint name of users.id -> auth.users if it exists."""
    result = connection.execute(
        sa.text("""
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            JOIN information_schema.referential_constraints rc
              ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
              ON rc.unique_constraint_name = ccu.constraint_name AND ccu.table_schema = rc.unique_constraint_schema
            WHERE tc.table_schema = 'public' AND tc.table_name = 'users'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND ccu.table_schema = 'auth' AND ccu.table_name = 'users'
            LIMIT 1
        """)
    )
    row = result.fetchone()
    return row[0] if row else None


def upgrade() -> None:
    connection = op.get_bind()
    constraint_name = _fk_to_auth_users(connection)
    if constraint_name:
        op.drop_constraint(constraint_name, "users", type_="foreignkey", schema="public")


def downgrade() -> None:
    # Re-creating the FK would require auth.users to exist and is Supabase-specific; leave no-op
    pass
