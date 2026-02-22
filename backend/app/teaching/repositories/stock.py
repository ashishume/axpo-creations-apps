"""Stock repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.stock import Stock


class StockRepository:
    async def get(self, db: AsyncSession, id: UUID) -> Stock | None:
        result = await db.execute(select(Stock).where(Stock.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Stock]:
        result = await db.execute(select(Stock).order_by(Stock.created_at.desc()))
        return list(result.scalars().all())

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Stock]:
        result = await db.execute(
            select(Stock).where(Stock.session_id == session_id).order_by(Stock.created_at.desc())
        )
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, stock: Stock) -> Stock:
        db.add(stock)
        await db.flush()
        await db.refresh(stock)
        return stock

    async def update(self, db: AsyncSession, stock: Stock) -> Stock:
        await db.flush()
        await db.refresh(stock)
        return stock

    async def delete(self, db: AsyncSession, stock: Stock) -> None:
        await db.delete(stock)
        await db.flush()


stock_repository = StockRepository()
