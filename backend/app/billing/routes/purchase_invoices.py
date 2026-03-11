"""Purchase invoice routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.billing.dependencies import get_billing_db_session, get_current_billing_user
from app.billing.schemas.purchase_invoice import (
    PurchaseInvoiceCreate,
    PurchaseInvoiceUpdate,
    PurchaseInvoiceResponse,
)
from app.billing.services.purchase_invoice import purchase_invoice_service
from app.billing.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/purchase-invoices", tags=["billing-purchase-invoices"])


@router.post("", response_model=PurchaseInvoiceResponse)
async def create_purchase_invoice(
    data: PurchaseInvoiceCreate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    purchase_invoice = await purchase_invoice_service.create(db, data)
    return PurchaseInvoiceResponse.model_validate(purchase_invoice)


@router.get("", response_model=list[PurchaseInvoiceResponse])
async def list_purchase_invoices(
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    purchase_invoices = await purchase_invoice_service.list_all(db)
    return [PurchaseInvoiceResponse.model_validate(pi) for pi in purchase_invoices]


@router.get("/{id}", response_model=PurchaseInvoiceResponse)
async def get_purchase_invoice(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    purchase_invoice = await purchase_invoice_service.get_or_404(db, id)
    return PurchaseInvoiceResponse.model_validate(purchase_invoice)


@router.patch("/{id}", response_model=PurchaseInvoiceResponse)
async def update_purchase_invoice(
    id: UUID,
    data: PurchaseInvoiceUpdate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    purchase_invoice = await purchase_invoice_service.update(db, id, data)
    return PurchaseInvoiceResponse.model_validate(purchase_invoice)


@router.delete("/{id}", status_code=204)
async def delete_purchase_invoice(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    await purchase_invoice_service.delete(db, id)
