"""User repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.user import User


class UserRepository:
    async def get(self, db: AsyncSession, id: UUID) -> User | None:
        result = await db.execute(select(User).where(User.id == id))
        return result.scalar_one_or_none()

    async def get_by_username(self, db: AsyncSession, username: str) -> User | None:
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def list_paginated(
        self, db: AsyncSession, page: int = 1, page_size: int = 10
    ) -> tuple[list[User], int]:
        offset = (page - 1) * page_size
        count_result = await db.execute(select(func.count(User.id)))
        total = count_result.scalar() or 0
        result = await db.execute(
            select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)
        )
        users = list(result.scalars().all())
        return users, total

    async def add(self, db: AsyncSession, user: User) -> User:
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    async def update(self, db: AsyncSession, user: User) -> User:
        await db.flush()
        await db.refresh(user)
        return user

    async def delete(self, db: AsyncSession, user: User) -> None:
        await db.delete(user)
        await db.flush()


user_repository = UserRepository()
