"""Class service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.class_model import Class
from app.teaching.schemas.class_schema import ClassCreate, ClassUpdate
from app.teaching.repositories.class_model import class_repository


class ClassService:
    async def create(self, db: AsyncSession, data: ClassCreate) -> Class:
        obj = Class(**data.model_dump())
        return await class_repository.add(db, obj)

    async def create_many(self, db: AsyncSession, items: list[ClassCreate]) -> list[Class]:
        out = []
        for d in items:
            obj = Class(**d.model_dump())
            out.append(await class_repository.add(db, obj))
        return out

    async def get(self, db: AsyncSession, id: UUID) -> Class | None:
        return await class_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Class:
        obj = await class_repository.get(db, id)
        if not obj:
            raise NotFoundError("Class not found")
        return obj

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Class]:
        return await class_repository.list_by_session(db, session_id)

    async def list_all(self, db: AsyncSession) -> list[Class]:
        return await class_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: ClassUpdate) -> Class:
        obj = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        return await class_repository.update(db, obj)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        obj = await self.get_or_404(db, id)
        await class_repository.delete(db, obj)


class_service = ClassService()
