"""School repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.school import School


class SchoolRepository:
    async def get(self, db: AsyncSession, id: UUID) -> School | None:
        result = await db.execute(select(School).where(School.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[School]:
        result = await db.execute(select(School).order_by(School.created_at.desc()))
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, school: School) -> School:
        db.add(school)
        await db.flush()
        await db.refresh(school)
        return school

    async def update(self, db: AsyncSession, school: School) -> School:
        await db.flush()
        await db.refresh(school)
        return school

    async def delete(self, db: AsyncSession, school: School) -> None:
        await db.delete(school)
        await db.flush()


school_repository = SchoolRepository()
