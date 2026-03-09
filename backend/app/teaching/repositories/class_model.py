"""Class repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.class_model import Class
from app.teaching.models.school import School, Session


class ClassRepository:
    async def get(self, db: AsyncSession, id: UUID) -> Class | None:
        result = await db.execute(select(Class).where(Class.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Class]:
        result = await db.execute(select(Class).order_by(Class.created_at.desc()))
        return list(result.scalars().all())

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Class]:
        result = await db.execute(
            select(Class).where(Class.session_id == session_id).order_by(Class.name)
        )
        return list(result.scalars().all())

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[Class]:
        result = await db.execute(
            select(Class)
            .join(Session, Class.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
            .order_by(Class.name)
        )
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, obj: Class) -> Class:
        db.add(obj)
        await db.flush()
        await db.refresh(obj)
        return obj

    async def update(self, db: AsyncSession, obj: Class) -> Class:
        await db.flush()
        await db.refresh(obj)
        return obj

    async def delete(self, db: AsyncSession, obj: Class) -> None:
        await db.delete(obj)
        await db.flush()


class_repository = ClassRepository()
