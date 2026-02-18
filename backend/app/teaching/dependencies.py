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
