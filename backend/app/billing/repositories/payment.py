"""Payment repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.models.payment import Payment, PaymentAllocation


def _payment_query():
    return select(Payment).options(selectinload(Payment.allocations))


class PaymentRepository:
    """Repository for Payment DB operations."""

    async def get(self, db: AsyncSession, id: UUID) -> Payment | None:
        result = await db.execute(_payment_query().where(Payment.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Payment]:
        result = await db.execute(_payment_query().order_by(Payment.created_at.desc()))
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, payment: Payment) -> Payment:
        db.add(payment)
        await db.flush()
        await db.refresh(payment)
        return payment

    async def add_allocation(self, db: AsyncSession, allocation: PaymentAllocation) -> PaymentAllocation:
        db.add(allocation)
        await db.flush()
        await db.refresh(allocation)
        return allocation

    async def delete(self, db: AsyncSession, payment: Payment) -> None:
        await db.delete(payment)
        await db.flush()


payment_repository = PaymentRepository()
