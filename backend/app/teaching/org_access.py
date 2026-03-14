"""Organization-scoped access control helpers.

Every non-Super-Admin user has an `organization_id`.  These helpers enforce
that such users can only read/write resources that belong to their org.
Super Admins (organization_id is None) bypass all checks.
"""
from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError
from app.teaching.models.user import User
from app.teaching.models.school import School, Session
from app.teaching.repositories.school import school_repository
from app.teaching.repositories.session import session_repository


def _is_super_admin(user: User) -> bool:
    return user.organization_id is None


async def enforce_school_access(db: AsyncSession, user: User, school_id: UUID) -> None:
    """Raise 403 if non-SA user's org doesn't own the school."""
    if _is_super_admin(user):
        return
    school = await school_repository.get(db, school_id)
    if not school or school.organization_id != user.organization_id:
        raise ForbiddenError("Access denied: school belongs to another organization")


async def enforce_session_access(db: AsyncSession, user: User, session_id: UUID) -> None:
    """Raise 403 if the session's school doesn't belong to the user's org. Loads session+school in one query."""
    if _is_super_admin(user):
        return
    session = await session_repository.get(db, session_id)
    if not session or not session.school:
        raise ForbiddenError("Access denied")
    if session.school.organization_id != user.organization_id:
        raise ForbiddenError("Access denied: session belongs to another organization")


async def enforce_session_child_access(
    db: AsyncSession, user: User, *, session_id: UUID
) -> None:
    """Shortcut for resources that hang off a session (student, staff, etc.)."""
    await enforce_session_access(db, user, session_id)


async def enforce_org_access(db: AsyncSession, user: User, org_id: UUID) -> None:
    """Raise 403 if non-SA user tries to access another org."""
    if _is_super_admin(user):
        return
    if user.organization_id != org_id:
        raise ForbiddenError("Access denied: not your organization")


async def enforce_user_access(db: AsyncSession, user: User, target_user: User) -> None:
    """Raise 403 if non-SA user tries to access a user from another org."""
    if _is_super_admin(user):
        return
    if target_user.organization_id != user.organization_id:
        raise ForbiddenError("Access denied: user belongs to another organization")
