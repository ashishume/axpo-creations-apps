"""Payment service: business logic and orchestration; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.billing.models.payment import Payment, PaymentAllocation
from app.billing.schemas.payment import PaymentCreate
from app.billing.repositories.payment import payment_repository


class PaymentService:
    """Payment application service."""

    async def create(self, db: AsyncSession, data: PaymentCreate) -> Payment:
        payload = data.model_dump(exclude={"allocations"})
        payment = Payment(**payload)
        await payment_repository.add(db, payment)
        for alloc_data in data.allocations:
            allocation = PaymentAllocation(payment_id=payment.id, **alloc_data.model_dump())
            await payment_repository.add_allocation(db, allocation)
        result = await payment_repository.get(db, payment.id)
        assert result is not None
        return result

    async def get(self, db: AsyncSession, id: UUID) -> Payment | None:
        return await payment_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Payment:
        payment = await payment_repository.get(db, id)
        if not payment:
            raise NotFoundError("Payment not found")
        return payment

    async def list_all(self, db: AsyncSession) -> list[Payment]:
        return await payment_repository.list_all(db)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        payment = await self.get_or_404(db, id)
        await payment_repository.delete(db, payment)


payment_service = PaymentService()
