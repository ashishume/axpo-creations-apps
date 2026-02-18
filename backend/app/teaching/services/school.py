"""School CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.teaching.models.school import School
from app.teaching.schemas.school import SchoolCreate, SchoolUpdate


class SchoolService:
    async def create(self, db: AsyncSession, data: SchoolCreate) -> School:
        school = School(**data.model_dump())
        db.add(school)
        await db.flush()
        await db.refresh(school)
        return school

    async def get(self, db: AsyncSession, id: UUID) -> School | None:
        result = await db.execute(select(School).where(School.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> School:
        school = await self.get(db, id)
        if not school:
            raise NotFoundError("School not found")
        return school

    async def list_all(self, db: AsyncSession) -> list[School]:
        result = await db.execute(select(School).order_by(School.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: SchoolUpdate) -> School:
        school = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(school, k, v)
        await db.flush()
        await db.refresh(school)
        return school

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        school = await self.get_or_404(db, id)
        await db.delete(school)
        await db.flush()


school_service = SchoolService()
