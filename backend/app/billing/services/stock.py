"""Stock movement CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.billing.models.stock import StockMovement
from app.billing.schemas.stock import StockMovementCreate


class StockService:
    async def create(self, db: AsyncSession, data: StockMovementCreate) -> StockMovement:
        movement = StockMovement(**data.model_dump())
        db.add(movement)
        await db.flush()
        await db.refresh(movement)
        return movement

    async def get(self, db: AsyncSession, id: UUID) -> StockMovement | None:
        result = await db.execute(select(StockMovement).where(StockMovement.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> StockMovement:
        movement = await self.get(db, id)
        if not movement:
            raise NotFoundError("Stock movement not found")
        return movement

    async def list_all(self, db: AsyncSession) -> list[StockMovement]:
        result = await db.execute(select(StockMovement).order_by(StockMovement.created_at.desc()))
        return list(result.scalars().all())

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        movement = await self.get_or_404(db, id)
        await db.delete(movement)
        await db.flush()


stock_service = StockService()
