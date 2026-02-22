"""Stock movement repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.models.stock import StockMovement


class StockRepository:
    """Repository for StockMovement DB operations."""

    async def get(self, db: AsyncSession, id: UUID) -> StockMovement | None:
        result = await db.execute(select(StockMovement).where(StockMovement.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[StockMovement]:
        result = await db.execute(select(StockMovement).order_by(StockMovement.created_at.desc()))
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, movement: StockMovement) -> StockMovement:
        db.add(movement)
        await db.flush()
        await db.refresh(movement)
        return movement

    async def delete(self, db: AsyncSession, movement: StockMovement) -> None:
        await db.delete(movement)
        await db.flush()


stock_repository = StockRepository()
