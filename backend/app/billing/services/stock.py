"""Stock movement service: business logic and orchestration; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.billing.models.stock import StockMovement
from app.billing.schemas.stock import StockMovementCreate
from app.billing.repositories.stock import stock_repository


class StockService:
    """Stock movement application service."""

    async def create(self, db: AsyncSession, data: StockMovementCreate) -> StockMovement:
        movement = StockMovement(**data.model_dump())
        return await stock_repository.add(db, movement)

    async def get(self, db: AsyncSession, id: UUID) -> StockMovement | None:
        return await stock_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> StockMovement:
        movement = await stock_repository.get(db, id)
        if not movement:
            raise NotFoundError("Stock movement not found")
        return movement

    async def list_all(self, db: AsyncSession) -> list[StockMovement]:
        return await stock_repository.list_all(db)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        movement = await self.get_or_404(db, id)
        await stock_repository.delete(db, movement)


stock_service = StockService()
