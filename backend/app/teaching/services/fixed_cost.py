"""Fixed monthly cost CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.teaching.models.fixed_cost import FixedMonthlyCost
from app.teaching.schemas.fixed_cost import FixedCostCreate, FixedCostUpdate


class FixedCostService:
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

    async def get(self, db: AsyncSession, id: UUID) -> FixedMonthlyCost | None:
        result = await db.execute(select(FixedMonthlyCost).where(FixedMonthlyCost.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> FixedMonthlyCost:
        cost = await self.get(db, id)
        if not cost:
            raise NotFoundError("Fixed cost not found")
        return cost

    async def create(self, db: AsyncSession, data: FixedCostCreate) -> FixedMonthlyCost:
        cost = FixedMonthlyCost(**data.model_dump())
        db.add(cost)
        await db.flush()
        await db.refresh(cost)
        return cost

    async def create_many(self, db: AsyncSession, items: list[FixedCostCreate]) -> list[FixedMonthlyCost]:
        costs = [FixedMonthlyCost(**d.model_dump()) for d in items]
        for c in costs:
            db.add(c)
        await db.flush()
        for c in costs:
            await db.refresh(c)
        return costs

    async def update(self, db: AsyncSession, id: UUID, data: FixedCostUpdate) -> FixedMonthlyCost:
        cost = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(cost, k, v)
        await db.flush()
        await db.refresh(cost)
        return cost

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        cost = await self.get_or_404(db, id)
        await db.delete(cost)
        await db.flush()


fixed_cost_service = FixedCostService()
