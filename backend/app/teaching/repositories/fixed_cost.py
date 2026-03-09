"""Fixed monthly cost repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.fixed_cost import FixedMonthlyCost
from app.teaching.models.school import School, Session


class FixedCostRepository:
    async def get(self, db: AsyncSession, id: UUID) -> FixedMonthlyCost | None:
        result = await db.execute(select(FixedMonthlyCost).where(FixedMonthlyCost.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[FixedMonthlyCost]:
        result = await db.execute(select(FixedMonthlyCost).order_by(FixedMonthlyCost.name))
        return list(result.scalars().all())

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[FixedMonthlyCost]:
        result = await db.execute(
            select(FixedMonthlyCost)
            .where(FixedMonthlyCost.session_id == session_id)
            .order_by(FixedMonthlyCost.name)
        )
        return list(result.scalars().all())

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[FixedMonthlyCost]:
        result = await db.execute(
            select(FixedMonthlyCost)
            .join(Session, FixedMonthlyCost.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
            .order_by(FixedMonthlyCost.name)
        )
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, cost: FixedMonthlyCost) -> FixedMonthlyCost:
        db.add(cost)
        await db.flush()
        await db.refresh(cost)
        return cost

    async def update(self, db: AsyncSession, cost: FixedMonthlyCost) -> FixedMonthlyCost:
        await db.flush()
        await db.refresh(cost)
        return cost

    async def delete(self, db: AsyncSession, cost: FixedMonthlyCost) -> None:
        await db.delete(cost)
        await db.flush()


fixed_cost_repository = FixedCostRepository()
