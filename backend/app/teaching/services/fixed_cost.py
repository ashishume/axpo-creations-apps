"""Fixed monthly cost service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.fixed_cost import FixedMonthlyCost
from app.teaching.schemas.fixed_cost import FixedCostCreate, FixedCostUpdate
from app.teaching.repositories.fixed_cost import fixed_cost_repository


class FixedCostService:
    async def list_all(self, db: AsyncSession) -> list[FixedMonthlyCost]:
        return await fixed_cost_repository.list_all(db)

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[FixedMonthlyCost]:
        return await fixed_cost_repository.list_by_session(db, session_id)

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[FixedMonthlyCost]:
        return await fixed_cost_repository.list_by_organization(db, organization_id)

    async def get(self, db: AsyncSession, id: UUID) -> FixedMonthlyCost | None:
        return await fixed_cost_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> FixedMonthlyCost:
        cost = await fixed_cost_repository.get(db, id)
        if not cost:
            raise NotFoundError("Fixed cost not found")
        return cost

    async def create(self, db: AsyncSession, data: FixedCostCreate) -> FixedMonthlyCost:
        cost = FixedMonthlyCost(**data.model_dump())
        return await fixed_cost_repository.add(db, cost)

    async def create_many(
        self, db: AsyncSession, items: list[FixedCostCreate]
    ) -> list[FixedMonthlyCost]:
        out = []
        for d in items:
            cost = FixedMonthlyCost(**d.model_dump())
            out.append(await fixed_cost_repository.add(db, cost))
        return out

    async def update(self, db: AsyncSession, id: UUID, data: FixedCostUpdate) -> FixedMonthlyCost:
        cost = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(cost, k, v)
        return await fixed_cost_repository.update(db, cost)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        cost = await self.get_or_404(db, id)
        await fixed_cost_repository.delete(db, cost)


fixed_cost_service = FixedCostService()
