"""Company routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.billing.dependencies import get_billing_db_session, get_current_billing_user
from app.billing.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.billing.services.company import company_service
from app.billing.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/companies", tags=["billing-companies"])


@router.post("", response_model=CompanyResponse)
async def create_company(
    data: CompanyCreate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    company = await company_service.create(db, data)
    return CompanyResponse.model_validate(company)


@router.get("", response_model=list[CompanyResponse])
async def list_companies(
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    companies = await company_service.list_all(db)
    return [CompanyResponse.model_validate(c) for c in companies]


@router.get("/{id}", response_model=CompanyResponse)
async def get_company(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    company = await company_service.get_or_404(db, id)
    return CompanyResponse.model_validate(company)


@router.patch("/{id}", response_model=CompanyResponse)
async def update_company(
    id: UUID,
    data: CompanyUpdate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    company = await company_service.update(db, id, data)
    return CompanyResponse.model_validate(company)


@router.delete("/{id}", status_code=204)
async def delete_company(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    await company_service.delete(db, id)
