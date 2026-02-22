"""Product service: business logic and orchestration; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.billing.models.product import Product
from app.billing.schemas.product import ProductCreate, ProductUpdate
from app.billing.repositories.product import product_repository


class ProductService:
    """Product application service."""

    async def create(self, db: AsyncSession, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        return await product_repository.add(db, product)

    async def get(self, db: AsyncSession, id: UUID) -> Product | None:
        return await product_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Product:
        product = await product_repository.get(db, id)
        if not product:
            raise NotFoundError("Product not found")
        return product

    async def list_all(self, db: AsyncSession) -> list[Product]:
        return await product_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: ProductUpdate) -> Product:
        product = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(product, k, v)
        return await product_repository.update(db, product)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        product = await self.get_or_404(db, id)
        await product_repository.delete(db, product)


product_service = ProductService()
