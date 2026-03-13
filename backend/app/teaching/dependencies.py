"""Teaching-specific FastAPI dependencies."""
from collections.abc import AsyncGenerator
from uuid import UUID

from fastapi import Cookie, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_teaching_db
from app.core.security import ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE
from app.core.dependencies import require_token_payload
from app.core.exceptions import UnauthorizedError

from app.teaching.models.user import User


async def get_teaching_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield teaching DB session for dependency injection."""
    async with get_teaching_db() as session:
        yield session


def get_teaching_access_token(
    access_token: str | None = Cookie(None, alias=ACCESS_TOKEN_COOKIE),
) -> str | None:
    """Get access token from cookie for teaching API."""
    return access_token


def get_teaching_refresh_token(
    refresh_token: str | None = Cookie(None, alias=REFRESH_TOKEN_COOKIE),
) -> str | None:
    """Get refresh token from cookie for teaching API."""
    return refresh_token


async def get_current_teaching_user(
    db: AsyncSession = Depends(get_teaching_db_session),
    access_token: str | None = Depends(get_teaching_access_token),
) -> User:
    """Require valid teaching JWT and return User. Raises UnauthorizedError if invalid."""
    payload = require_token_payload(access_token, expected_domain="teaching")
    sub = payload.get("sub")
    if not sub:
        raise UnauthorizedError("Invalid token")
    try:
        user_id = UUID(sub)
    except (ValueError, TypeError):
        raise UnauthorizedError("Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedError("User not found")
    return user


def require_teaching_permission(permission: str):
    """Return a dependency that requires the current user to have the given permission."""

    async def _require(
        db: AsyncSession = Depends(get_teaching_db_session),
        user: User = Depends(get_current_teaching_user),
    ) -> User:
        from app.teaching.services.auth import auth_service

        permissions = await auth_service.get_permissions_for_user(db, user)
        if permission not in permissions:
            from app.core.exceptions import ForbiddenError
            raise ForbiddenError("Insufficient permissions")
        return user

    return _require


def require_any_teaching_permission(*permissions: str):
    """Return a dependency that requires the current user to have at least one of the given permissions."""

    async def _require(
        db: AsyncSession = Depends(get_teaching_db_session),
        user: User = Depends(get_current_teaching_user),
    ) -> User:
        from app.teaching.services.auth import auth_service
        from app.core.exceptions import ForbiddenError

        user_perms = await auth_service.get_permissions_for_user(db, user)
        if not any(p in user_perms for p in permissions):
            raise ForbiddenError("Insufficient permissions")
        return user

    return _require


async def require_active_org_subscription(
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
) -> User:
    """
    Require valid user and, if org user, an active non-locked org subscription.
    Super Admin (organization_id is None) always passes.
    Raises 403 with detail 'subscription_required' when org has no active subscription or is locked.
    """
    from fastapi import HTTPException
    from app.teaching.models.subscription import OrgSubscription

    if user.organization_id is None:
        return user
    result = await db.execute(
        select(OrgSubscription).where(OrgSubscription.organization_id == user.organization_id)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=403, detail="subscription_required")
    if row.is_locked:
        raise HTTPException(status_code=403, detail="subscription_required")
    if row.status != "active":
        raise HTTPException(status_code=403, detail="subscription_required")
    if row.current_period_end and not row.razorpay_subscription_id:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        end_utc = row.current_period_end if row.current_period_end.tzinfo else row.current_period_end.replace(tzinfo=timezone.utc)
        if end_utc < now:
            raise HTTPException(status_code=403, detail="subscription_required")
    return user
