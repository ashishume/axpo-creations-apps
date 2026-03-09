"""School service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.school import School
from app.teaching.schemas.school import SchoolCreate, SchoolUpdate
from app.teaching.repositories.school import school_repository


class SchoolService:
    async def create(self, db: AsyncSession, data: SchoolCreate) -> School:
        school = School(**data.model_dump())
        return await school_repository.add(db, school)

    async def get(self, db: AsyncSession, id: UUID) -> School | None:
        return await school_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> School:
        school = await school_repository.get(db, id)
        if not school:
            raise NotFoundError("School not found")
        return school

    async def list_all(self, db: AsyncSession) -> list[School]:
        return await school_repository.list_all(db)

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[School]:
        return await school_repository.list_by_organization(db, organization_id)

    async def update(self, db: AsyncSession, id: UUID, data: SchoolUpdate) -> School:
        school = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(school, k, v)
        return await school_repository.update(db, school)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        school = await self.get_or_404(db, id)
        await school_repository.delete(db, school)


school_service = SchoolService()
