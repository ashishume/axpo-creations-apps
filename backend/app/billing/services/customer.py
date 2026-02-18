"""Customer CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.billing.models.customer import Customer
from app.billing.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerService:
    async def create(self, db: AsyncSession, data: CustomerCreate) -> Customer:
        customer = Customer(**data.model_dump())
        db.add(customer)
        await db.flush()
        await db.refresh(customer)
        return customer

    async def get(self, db: AsyncSession, id: UUID) -> Customer | None:
        result = await db.execute(select(Customer).where(Customer.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Customer:
        customer = await self.get(db, id)
        if not customer:
            raise NotFoundError("Customer not found")
        return customer

    async def list_all(self, db: AsyncSession) -> list[Customer]:
        result = await db.execute(select(Customer).order_by(Customer.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: CustomerUpdate) -> Customer:
        customer = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(customer, k, v)
        await db.flush()
        await db.refresh(customer)
        return customer

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        customer = await self.get_or_404(db, id)
        await db.delete(customer)
        await db.flush()


customer_service = CustomerService()
