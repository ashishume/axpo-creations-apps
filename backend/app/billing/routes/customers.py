"""Customer routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.billing.dependencies import get_billing_db_session, get_current_billing_user
from app.billing.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.billing.services.customer import customer_service
from app.billing.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/customers", tags=["billing-customers"])


@router.post("", response_model=CustomerResponse)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    customer = await customer_service.create(db, data)
    return CustomerResponse.model_validate(customer)


@router.get("", response_model=list[CustomerResponse])
async def list_customers(
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    customers = await customer_service.list_all(db)
    return [CustomerResponse.model_validate(c) for c in customers]


@router.get("/{id}", response_model=CustomerResponse)
async def get_customer(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    customer = await customer_service.get_or_404(db, id)
    return CustomerResponse.model_validate(customer)


@router.patch("/{id}", response_model=CustomerResponse)
async def update_customer(
    id: UUID,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    customer = await customer_service.update(db, id, data)
    return CustomerResponse.model_validate(customer)


@router.delete("/{id}", status_code=204)
async def delete_customer(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    await customer_service.delete(db, id)
