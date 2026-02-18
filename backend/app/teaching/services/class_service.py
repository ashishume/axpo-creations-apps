"""Class CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.teaching.models.class_model import Class
from app.teaching.schemas.class_schema import ClassCreate, ClassUpdate


class ClassService:
    async def create(self, db: AsyncSession, data: ClassCreate) -> Class:
        obj = Class(**data.model_dump())
        db.add(obj)
        await db.flush()
        await db.refresh(obj)
        return obj

    async def create_many(self, db: AsyncSession, items: list[ClassCreate]) -> list[Class]:
        objs = [Class(**d.model_dump()) for d in items]
        for o in objs:
            db.add(o)
        await db.flush()
        for o in objs:
            await db.refresh(o)
        return objs

    async def get(self, db: AsyncSession, id: UUID) -> Class | None:
        result = await db.execute(select(Class).where(Class.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Class:
        obj = await self.get(db, id)
        if not obj:
            raise NotFoundError("Class not found")
        return obj

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Class]:
        result = await db.execute(
            select(Class).where(Class.session_id == session_id).order_by(Class.name)
        )
        return list(result.scalars().all())

    async def list_all(self, db: AsyncSession) -> list[Class]:
        result = await db.execute(select(Class).order_by(Class.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: ClassUpdate) -> Class:
        obj = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        await db.flush()
        await db.refresh(obj)
        return obj

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        obj = await self.get_or_404(db, id)
        await db.delete(obj)
        await db.flush()


class_service = ClassService()
