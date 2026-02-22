"""Staff repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.staff import Staff


class StaffRepository:
    async def get(self, db: AsyncSession, id: UUID) -> Staff | None:
        result = await db.execute(select(Staff).where(Staff.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Staff]:
        result = await db.execute(select(Staff).order_by(Staff.created_at.desc()))
        return list(result.scalars().all())

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Staff]:
        result = await db.execute(
            select(Staff).where(Staff.session_id == session_id).order_by(Staff.employee_id)
        )
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, staff: Staff) -> Staff:
        db.add(staff)
        await db.flush()
        await db.refresh(staff)
        return staff

    async def update(self, db: AsyncSession, staff: Staff) -> Staff:
        await db.flush()
        await db.refresh(staff)
        return staff

    async def delete(self, db: AsyncSession, staff: Staff) -> None:
        await db.delete(staff)
        await db.flush()


staff_repository = StaffRepository()
