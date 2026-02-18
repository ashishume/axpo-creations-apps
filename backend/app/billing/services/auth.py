"""Auth service - login, refresh, get user."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.exceptions import UnauthorizedError, ConflictError

from app.billing.models.user import User


class AuthService:
    async def login(self, db: AsyncSession, email: str, password: str) -> User:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")
        return user

    def create_tokens(self, user: User, domain: str = "billing") -> tuple[str, str]:
        data = {"sub": str(user.id)}
        access = create_access_token(data, domain=domain)
        refresh = create_refresh_token(data, domain=domain)
        return access, refresh

    def refresh_access_token(self, refresh_token: str, domain: str = "billing") -> dict | None:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh" or payload.get("domain") != domain:
            return None
        sub = payload.get("sub")
        if not sub:
            return None
        data = {"sub": sub}
        access = create_access_token(data, domain=domain)
        return {"sub": sub, "access_token": access}

    async def get_user_by_id(self, db: AsyncSession, user_id: UUID) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def register(
        self,
        db: AsyncSession,
        email: str,
        password: str,
        name: str | None = None,
        role: str = "user",
    ) -> User:
        result = await db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            raise ConflictError("Email already registered")
        user = User(
            email=email,
            name=name or email.split("@")[0],
            password_hash=hash_password(password),
            role=role,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user


auth_service = AuthService()
