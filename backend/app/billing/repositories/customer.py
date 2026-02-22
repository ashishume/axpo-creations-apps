"""Customer repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.models.customer import Customer


class CustomerRepository:
    """Repository for Customer DB operations."""

    async def get(self, db: AsyncSession, id: UUID) -> Customer | None:
        result = await db.execute(select(Customer).where(Customer.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Customer]:
        result = await db.execute(select(Customer).order_by(Customer.created_at.desc()))
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, customer: Customer) -> Customer:
        db.add(customer)
        await db.flush()
        await db.refresh(customer)
        return customer

    async def update(self, db: AsyncSession, customer: Customer) -> Customer:
        await db.flush()
        await db.refresh(customer)
        return customer

    async def delete(self, db: AsyncSession, customer: Customer) -> None:
        await db.delete(customer)
        await db.flush()


customer_repository = CustomerRepository()
