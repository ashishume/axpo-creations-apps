"""Stock service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.stock import Stock, StockTransaction
from app.teaching.schemas.stock import StockCreate, StockUpdate, StockTransactionCreate
from app.teaching.repositories.stock import stock_repository


class StockService:
    async def create(self, db: AsyncSession, data: StockCreate) -> Stock:
        stock = Stock(**data.model_dump())
        return await stock_repository.add(db, stock)

    async def create_many(self, db: AsyncSession, items: list[StockCreate]) -> list[Stock]:
        out = []
        for d in items:
            stock = Stock(**d.model_dump())
            out.append(await stock_repository.add(db, stock))
        return out

    async def get(self, db: AsyncSession, id: UUID) -> Stock | None:
        return await stock_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Stock:
        stock = await stock_repository.get(db, id)
        if not stock:
            raise NotFoundError("Stock not found")
        return stock

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Stock]:
        return await stock_repository.list_by_session(db, session_id)

    async def list_all(self, db: AsyncSession) -> list[Stock]:
        return await stock_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: StockUpdate) -> Stock:
        stock = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(stock, k, v)
        return await stock_repository.update(db, stock)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        stock = await self.get_or_404(db, id)
        await stock_repository.delete(db, stock)

    async def add_transaction(
        self, db: AsyncSession, stock_id: UUID, data: StockTransactionCreate
    ) -> StockTransaction:
        await self.get_or_404(db, stock_id)
        return await stock_repository.add_transaction(
            db,
            stock_id,
            transaction_date=data.date,
            type=data.type,
            amount=data.amount,
            quantity=data.quantity,
            description=data.description,
            receipt_number=data.receipt_number,
        )

    async def delete_transaction(
        self, db: AsyncSession, stock_id: UUID, transaction_id: UUID
    ) -> bool:
        await self.get_or_404(db, stock_id)
        return await stock_repository.delete_transaction(db, transaction_id, stock_id)


stock_service = StockService()
