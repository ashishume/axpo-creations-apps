"""Staff service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.staff import Staff
from app.teaching.schemas.staff import StaffCreate, StaffUpdate
from app.teaching.repositories.staff import staff_repository


class StaffService:
    async def create(self, db: AsyncSession, data: StaffCreate) -> Staff:
        staff = Staff(**data.model_dump())
        return await staff_repository.add(db, staff)

    async def create_many(self, db: AsyncSession, items: list[StaffCreate]) -> list[Staff]:
        out = []
        for d in items:
            staff = Staff(**d.model_dump())
            out.append(await staff_repository.add(db, staff))
        return out

    async def get(self, db: AsyncSession, id: UUID) -> Staff | None:
        return await staff_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Staff:
        staff = await staff_repository.get(db, id)
        if not staff:
            raise NotFoundError("Staff not found")
        return staff

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Staff]:
        return await staff_repository.list_by_session(db, session_id)

    async def list_all(self, db: AsyncSession) -> list[Staff]:
        return await staff_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: StaffUpdate) -> Staff:
        staff = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(staff, k, v)
        return await staff_repository.update(db, staff)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        staff = await self.get_or_404(db, id)
        await staff_repository.delete(db, staff)


staff_service = StaffService()
