"""Product repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.models.product import Product


class ProductRepository:
    """Repository for Product DB operations."""

    async def get(self, db: AsyncSession, id: UUID) -> Product | None:
        result = await db.execute(select(Product).where(Product.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Product]:
        result = await db.execute(select(Product).order_by(Product.created_at.desc()))
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, product: Product) -> Product:
        db.add(product)
        await db.flush()
        await db.refresh(product)
        return product

    async def update(self, db: AsyncSession, product: Product) -> Product:
        await db.flush()
        await db.refresh(product)
        return product

    async def delete(self, db: AsyncSession, product: Product) -> None:
        await db.delete(product)
        await db.flush()


product_repository = ProductRepository()
