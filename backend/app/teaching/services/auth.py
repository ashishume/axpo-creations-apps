"""Teaching auth service - login by username, refresh, get user."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import UnauthorizedError, ConflictError

from app.teaching.models.user import User
from app.teaching.models.role import RolePermission


class AuthService:
    async def login(self, db: AsyncSession, username: str, password: str) -> User:
        result = await db.execute(
            select(User).options(joinedload(User.role)).where(User.username == username, User.is_active == True)
        )
        user = result.scalar_one_or_none()
        if not user or not user.password_hash or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid username or password")
        return user

    def create_tokens(self, user: User, domain: str = "teaching") -> tuple[str, str]:
        data = {"sub": str(user.id)}
        access = create_access_token(data, domain=domain)
        refresh = create_refresh_token(data, domain=domain)
        return access, refresh

    def refresh_access_token(self, refresh_token: str, domain: str = "teaching") -> dict | None:
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

    async def change_password(
        self, db: AsyncSession, user: User, current_password: str, new_password: str
    ) -> None:
        if not user.password_hash or not verify_password(current_password, user.password_hash):
            raise UnauthorizedError("Current password is incorrect")
        user.password_hash = hash_password(new_password)
        user.must_change_password = False
        await db.flush()
        await db.refresh(user)

    async def get_permissions_for_user(self, db: AsyncSession, user: User) -> list[str]:
        result = await db.execute(
            select(RolePermission.permission_id).where(RolePermission.role_id == user.role_id)
        )
        return [row for row in result.scalars().all()]


auth_service = AuthService()
