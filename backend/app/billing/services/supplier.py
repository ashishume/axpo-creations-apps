"""Supplier service: business logic and orchestration; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.billing.models.supplier import Supplier
from app.billing.schemas.supplier import SupplierCreate, SupplierUpdate
from app.billing.repositories.supplier import supplier_repository


class SupplierService:
    """Supplier application service."""

    async def create(self, db: AsyncSession, data: SupplierCreate) -> Supplier:
        supplier = Supplier(**data.model_dump())
        return await supplier_repository.add(db, supplier)

    async def get(self, db: AsyncSession, id: UUID) -> Supplier | None:
        return await supplier_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Supplier:
        supplier = await supplier_repository.get(db, id)
        if not supplier:
            raise NotFoundError("Supplier not found")
        return supplier

    async def list_all(self, db: AsyncSession) -> list[Supplier]:
        return await supplier_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: SupplierUpdate) -> Supplier:
        supplier = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(supplier, k, v)
        return await supplier_repository.update(db, supplier)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        supplier = await self.get_or_404(db, id)
        await supplier_repository.delete(db, supplier)


supplier_service = SupplierService()
