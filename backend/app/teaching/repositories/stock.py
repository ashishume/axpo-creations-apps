"""Stock repository: DB operations only."""
from datetime import date
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.stock import Stock, StockTransaction
from app.teaching.models.school import School, Session


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

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[Stock]:
        result = await db.execute(
            select(Stock)
            .join(Session, Stock.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
            .order_by(Stock.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_by_session(self, db: AsyncSession, session_id: UUID) -> int:
        result = await db.execute(select(func.count()).select_from(Stock).where(Stock.session_id == session_id))
        return result.scalar() or 0

    async def list_by_session_paginated(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> list[Stock]:
        result = await db.execute(
            select(Stock)
            .where(Stock.session_id == session_id)
            .order_by(Stock.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def count_by_organization(self, db: AsyncSession, organization_id: UUID) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(Stock)
            .join(Session, Stock.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
        )
        return result.scalar() or 0

    async def list_by_organization_paginated(
        self,
        db: AsyncSession,
        organization_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> list[Stock]:
        result = await db.execute(
            select(Stock)
            .join(Session, Stock.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
            .order_by(Stock.created_at.desc())
            .limit(limit)
            .offset(offset)
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

    async def add_transaction(
        self,
        db: AsyncSession,
        stock_id: UUID,
        *,
        transaction_date: date,
        type: str,
        amount,
        quantity: int | None = None,
        description: str | None = None,
        receipt_number: str | None = None,
    ) -> StockTransaction:
        from decimal import Decimal
        tx = StockTransaction(
            stock_id=stock_id,
            date=transaction_date,
            type=type,
            amount=Decimal(str(amount)),
            quantity=quantity,
            description=description,
            receipt_number=receipt_number,
        )
        db.add(tx)
        await db.flush()
        await db.refresh(tx)
        return tx

    async def delete_transaction(
        self, db: AsyncSession, transaction_id: UUID, stock_id: UUID
    ) -> bool:
        result = await db.execute(
            select(StockTransaction).where(
                StockTransaction.id == transaction_id,
                StockTransaction.stock_id == stock_id,
            )
        )
        tx = result.scalar_one_or_none()
        if not tx:
            return False
        await db.delete(tx)
        await db.flush()
        return True


stock_repository = StockRepository()
