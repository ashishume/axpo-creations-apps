"""Product routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.billing.dependencies import get_billing_db_session, get_current_billing_user
from app.billing.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.billing.services.product import product_service
from app.billing.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/products", tags=["billing-products"])


@router.post("", response_model=ProductResponse)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    product = await product_service.create(db, data)
    return ProductResponse.model_validate(product)


@router.get("", response_model=list[ProductResponse])
async def list_products(
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    products = await product_service.list_all(db)
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/{id}", response_model=ProductResponse)
async def get_product(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    product = await product_service.get_or_404(db, id)
    return ProductResponse.model_validate(product)


@router.patch("/{id}", response_model=ProductResponse)
async def update_product(
    id: UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    product = await product_service.update(db, id, data)
    return ProductResponse.model_validate(product)


@router.delete("/{id}", status_code=204)
async def delete_product(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    await product_service.delete(db, id)
