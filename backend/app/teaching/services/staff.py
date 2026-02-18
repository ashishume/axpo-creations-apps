"""Staff CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.teaching.models.staff import Staff
from app.teaching.schemas.staff import StaffCreate, StaffUpdate


class StaffService:
    async def create(self, db: AsyncSession, data: StaffCreate) -> Staff:
        staff = Staff(**data.model_dump())
        db.add(staff)
        await db.flush()
        await db.refresh(staff)
        return staff

    async def create_many(self, db: AsyncSession, items: list[StaffCreate]) -> list[Staff]:
        staff_list = [Staff(**d.model_dump()) for d in items]
        for s in staff_list:
            db.add(s)
        await db.flush()
        for s in staff_list:
            await db.refresh(s)
        return staff_list

    async def get(self, db: AsyncSession, id: UUID) -> Staff | None:
        result = await db.execute(select(Staff).where(Staff.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Staff:
        staff = await self.get(db, id)
        if not staff:
            raise NotFoundError("Staff not found")
        return staff

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Staff]:
        result = await db.execute(
            select(Staff).where(Staff.session_id == session_id).order_by(Staff.employee_id)
        )
        return list(result.scalars().all())

    async def list_all(self, db: AsyncSession) -> list[Staff]:
        result = await db.execute(select(Staff).order_by(Staff.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: StaffUpdate) -> Staff:
        staff = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(staff, k, v)
        await db.flush()
        await db.refresh(staff)
        return staff

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        staff = await self.get_or_404(db, id)
        await db.delete(staff)
        await db.flush()


staff_service = StaffService()
