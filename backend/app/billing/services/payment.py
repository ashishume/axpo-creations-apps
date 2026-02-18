"""Payment CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.billing.models.payment import Payment, PaymentAllocation
from app.billing.schemas.payment import PaymentCreate


def _payment_query():
    return select(Payment).options(selectinload(Payment.allocations))


class PaymentService:
    async def create(self, db: AsyncSession, data: PaymentCreate) -> Payment:
        allocations_data = data.allocations
        payload = data.model_dump(exclude={"allocations"})
        payment = Payment(**payload)
        db.add(payment)
        await db.flush()
        for alloc in allocations_data:
            pa = PaymentAllocation(payment_id=payment.id, **alloc.model_dump())
            db.add(pa)
        await db.flush()
        result = await db.execute(_payment_query().where(Payment.id == payment.id))
        return result.scalar_one()

    async def get(self, db: AsyncSession, id: UUID) -> Payment | None:
        result = await db.execute(_payment_query().where(Payment.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Payment:
        payment = await self.get(db, id)
        if not payment:
            raise NotFoundError("Payment not found")
        return payment

    async def list_all(self, db: AsyncSession) -> list[Payment]:
        result = await db.execute(_payment_query().order_by(Payment.created_at.desc()))
        return list(result.scalars().all())

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        payment = await self.get_or_404(db, id)
        await db.delete(payment)
        await db.flush()


payment_service = PaymentService()
