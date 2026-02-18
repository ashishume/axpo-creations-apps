"""Invoice routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.billing.dependencies import get_billing_db_session, get_current_billing_user
from app.billing.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.billing.services.invoice import invoice_service
from app.billing.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/invoices", tags=["billing-invoices"])


@router.post("", response_model=InvoiceResponse)
async def create_invoice(
    data: InvoiceCreate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    invoice = await invoice_service.create(db, data)
    return InvoiceResponse.model_validate(invoice)


@router.get("", response_model=list[InvoiceResponse])
async def list_invoices(
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    invoices = await invoice_service.list_all(db)
    return [InvoiceResponse.model_validate(i) for i in invoices]


@router.get("/{id}", response_model=InvoiceResponse)
async def get_invoice(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    invoice = await invoice_service.get_or_404(db, id)
    return InvoiceResponse.model_validate(invoice)


@router.patch("/{id}", response_model=InvoiceResponse)
async def update_invoice(
    id: UUID,
    data: InvoiceUpdate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    invoice = await invoice_service.update(db, id, data)
    return InvoiceResponse.model_validate(invoice)


@router.delete("/{id}", status_code=204)
async def delete_invoice(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    await invoice_service.delete(db, id)
