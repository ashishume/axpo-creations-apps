"""User service: business logic for user CRUD and reset password."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.core.exceptions import NotFoundError, ConflictError, ForbiddenError

from app.teaching.models.user import User
from app.teaching.repositories.user import user_repository
from app.teaching.repositories.role import role_repository
from app.teaching.schemas.auth import CreateUserRequest, UpdateUserRequest

# Role id for Super Admin in seed data (cannot create/assign/delete)
SUPER_ADMIN_ROLE_ID = UUID("00000000-0000-0000-0000-000000000000")


class UserService:
    async def list_paginated(
        self, db: AsyncSession, page: int = 1, page_size: int = 10,
        organization_id: UUID | None = None,
    ) -> tuple[list[User], int]:
        return await user_repository.list_paginated(
            db, page=page, page_size=page_size, organization_id=organization_id,
        )

    async def get(self, db: AsyncSession, id: UUID) -> User | None:
        return await user_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> User:
        user = await user_repository.get(db, id)
        if not user:
            raise NotFoundError("User not found")
        return user

    async def create(self, db: AsyncSession, data: CreateUserRequest) -> User:
        if data.role_id == SUPER_ADMIN_ROLE_ID:
            raise ForbiddenError("Cannot create a Super Admin user.")
        existing = await user_repository.get_by_username(db, data.username)
        if existing:
            raise ConflictError("Username already exists")
        user = User(
            username=data.username,
            email=data.email,
            name=data.name,
            role_id=data.role_id,
            organization_id=data.organization_id,
            password_hash=hash_password(data.password),
            must_change_password=True,
            is_active=True,
            staff_id=data.staff_id,
            student_id=data.student_id,
        )
        return await user_repository.add(db, user)

    async def update(self, db: AsyncSession, id: UUID, data: UpdateUserRequest) -> User:
        user = await self.get_or_404(db, id)
        if data.role_id is not None and data.role_id == SUPER_ADMIN_ROLE_ID:
            raise ForbiddenError("Cannot assign the Super Admin role.")
        if data.email is not None:
            user.email = data.email
        if data.name is not None:
            user.name = data.name
        if data.role_id is not None:
            user.role_id = data.role_id
        if data.is_active is not None:
            user.is_active = data.is_active
        if data.organization_id is not None:
            user.organization_id = data.organization_id
        if data.staff_id is not None:
            user.staff_id = data.staff_id
        if data.student_id is not None:
            user.student_id = data.student_id
        return await user_repository.update(db, user)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        user = await self.get_or_404(db, id)
        if user.role_id == SUPER_ADMIN_ROLE_ID:
            raise ForbiddenError("Cannot delete a Super Admin user.")
        await user_repository.delete(db, user)

    async def reset_password(self, db: AsyncSession, id: UUID, new_password: str) -> None:
        user = await self.get_or_404(db, id)
        user.password_hash = hash_password(new_password)
        user.must_change_password = True
        await user_repository.update(db, user)


user_service = UserService()
