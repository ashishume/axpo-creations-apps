"""Customer service: business logic and orchestration; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.billing.models.customer import Customer
from app.billing.schemas.customer import CustomerCreate, CustomerUpdate
from app.billing.repositories.customer import customer_repository


class CustomerService:
    """Customer application service."""

    async def create(self, db: AsyncSession, data: CustomerCreate) -> Customer:
        customer = Customer(**data.model_dump())
        return await customer_repository.add(db, customer)

    async def get(self, db: AsyncSession, id: UUID) -> Customer | None:
        return await customer_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Customer:
        customer = await customer_repository.get(db, id)
        if not customer:
            raise NotFoundError("Customer not found")
        return customer

    async def list_all(self, db: AsyncSession) -> list[Customer]:
        return await customer_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: CustomerUpdate) -> Customer:
        customer = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(customer, k, v)
        return await customer_repository.update(db, customer)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        customer = await self.get_or_404(db, id)
        await customer_repository.delete(db, customer)


customer_service = CustomerService()
