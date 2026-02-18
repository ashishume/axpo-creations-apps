"""Payment routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.billing.dependencies import get_billing_db_session, get_current_billing_user
from app.billing.schemas.payment import PaymentCreate, PaymentResponse
from app.billing.services.payment import payment_service
from app.billing.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/payments", tags=["billing-payments"])


@router.post("", response_model=PaymentResponse)
async def create_payment(
    data: PaymentCreate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    payment = await payment_service.create(db, data)
    return PaymentResponse.model_validate(payment)


@router.get("", response_model=list[PaymentResponse])
async def list_payments(
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    payments = await payment_service.list_all(db)
    return [PaymentResponse.model_validate(p) for p in payments]


@router.get("/{id}", response_model=PaymentResponse)
async def get_payment(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    payment = await payment_service.get_or_404(db, id)
    return PaymentResponse.model_validate(payment)


@router.delete("/{id}", status_code=204)
async def delete_payment(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    await payment_service.delete(db, id)
