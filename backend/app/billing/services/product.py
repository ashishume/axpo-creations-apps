"""Product CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.billing.models.product import Product
from app.billing.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    async def create(self, db: AsyncSession, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        db.add(product)
        await db.flush()
        await db.refresh(product)
        return product

    async def get(self, db: AsyncSession, id: UUID) -> Product | None:
        result = await db.execute(select(Product).where(Product.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Product:
        product = await self.get(db, id)
        if not product:
            raise NotFoundError("Product not found")
        return product

    async def list_all(self, db: AsyncSession) -> list[Product]:
        result = await db.execute(select(Product).order_by(Product.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: ProductUpdate) -> Product:
        product = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(product, k, v)
        await db.flush()
        await db.refresh(product)
        return product

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        product = await self.get_or_404(db, id)
        await db.delete(product)
        await db.flush()


product_service = ProductService()
