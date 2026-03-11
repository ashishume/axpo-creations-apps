"""Supplier routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.billing.dependencies import get_billing_db_session, get_current_billing_user
from app.billing.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.billing.services.supplier import supplier_service
from app.billing.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/suppliers", tags=["billing-suppliers"])


@router.post("", response_model=SupplierResponse)
async def create_supplier(
    data: SupplierCreate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    supplier = await supplier_service.create(db, data)
    return SupplierResponse.model_validate(supplier)


@router.get("", response_model=list[SupplierResponse])
async def list_suppliers(
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    suppliers = await supplier_service.list_all(db)
    return [SupplierResponse.model_validate(s) for s in suppliers]


@router.get("/{id}", response_model=SupplierResponse)
async def get_supplier(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    supplier = await supplier_service.get_or_404(db, id)
    return SupplierResponse.model_validate(supplier)


@router.patch("/{id}", response_model=SupplierResponse)
async def update_supplier(
    id: UUID,
    data: SupplierUpdate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    supplier = await supplier_service.update(db, id, data)
    return SupplierResponse.model_validate(supplier)


@router.delete("/{id}", status_code=204)
async def delete_supplier(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    await supplier_service.delete(db, id)
