"""Stock CRUD service for teaching."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.teaching.models.stock import Stock
from app.teaching.schemas.stock import StockCreate, StockUpdate


class StockService:
    async def create(self, db: AsyncSession, data: StockCreate) -> Stock:
        stock = Stock(**data.model_dump())
        db.add(stock)
        await db.flush()
        await db.refresh(stock)
        return stock

    async def create_many(self, db: AsyncSession, items: list[StockCreate]) -> list[Stock]:
        stocks = [Stock(**d.model_dump()) for d in items]
        for s in stocks:
            db.add(s)
        await db.flush()
        for s in stocks:
            await db.refresh(s)
        return stocks

    async def get(self, db: AsyncSession, id: UUID) -> Stock | None:
        result = await db.execute(select(Stock).where(Stock.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Stock:
        stock = await self.get(db, id)
        if not stock:
            raise NotFoundError("Stock not found")
        return stock

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Stock]:
        result = await db.execute(
            select(Stock).where(Stock.session_id == session_id).order_by(Stock.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_all(self, db: AsyncSession) -> list[Stock]:
        result = await db.execute(select(Stock).order_by(Stock.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: StockUpdate) -> Stock:
        stock = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(stock, k, v)
        await db.flush()
        await db.refresh(stock)
        return stock

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        stock = await self.get_or_404(db, id)
        await db.delete(stock)
        await db.flush()


stock_service = StockService()
