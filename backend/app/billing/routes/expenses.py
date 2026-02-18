"""Expense routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.billing.dependencies import get_billing_db_session, get_current_billing_user
from app.billing.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.billing.services.expense import expense_service
from app.billing.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/expenses", tags=["billing-expenses"])


@router.post("", response_model=ExpenseResponse)
async def create_expense(
    data: ExpenseCreate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    expense = await expense_service.create(db, data)
    return ExpenseResponse.model_validate(expense)


@router.get("", response_model=list[ExpenseResponse])
async def list_expenses(
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    expenses = await expense_service.list_all(db)
    return [ExpenseResponse.model_validate(e) for e in expenses]


@router.get("/{id}", response_model=ExpenseResponse)
async def get_expense(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    expense = await expense_service.get_or_404(db, id)
    return ExpenseResponse.model_validate(expense)


@router.patch("/{id}", response_model=ExpenseResponse)
async def update_expense(
    id: UUID,
    data: ExpenseUpdate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    expense = await expense_service.update(db, id, data)
    return ExpenseResponse.model_validate(expense)


@router.delete("/{id}", status_code=204)
async def delete_expense(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    await expense_service.delete(db, id)
