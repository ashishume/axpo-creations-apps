"""Supplier repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.models.supplier import Supplier


class SupplierRepository:
    """Repository for Supplier DB operations."""

    async def get(self, db: AsyncSession, id: UUID) -> Supplier | None:
        result = await db.execute(select(Supplier).where(Supplier.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Supplier]:
        result = await db.execute(select(Supplier).order_by(Supplier.created_at.desc()))
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, supplier: Supplier) -> Supplier:
        db.add(supplier)
        await db.flush()
        await db.refresh(supplier)
        return supplier

    async def update(self, db: AsyncSession, supplier: Supplier) -> Supplier:
        await db.flush()
        await db.refresh(supplier)
        return supplier

    async def delete(self, db: AsyncSession, supplier: Supplier) -> None:
        await db.delete(supplier)
        await db.flush()


supplier_repository = SupplierRepository()
