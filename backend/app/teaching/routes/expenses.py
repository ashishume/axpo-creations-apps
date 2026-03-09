"""Expense routes for teaching."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.teaching.services.expense import expense_service
from app.teaching.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/expenses", tags=["teaching-expenses"])


@router.post("", response_model=ExpenseResponse)
async def create_expense(
    data: ExpenseCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    expense = await expense_service.create(db, data)
    return ExpenseResponse.model_validate(expense)


@router.get("", response_model=list[ExpenseResponse])
async def list_expenses(
    session_id: UUID | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    if session_id:
        expenses = await expense_service.list_by_session(db, session_id)
    elif user.organization_id:
        expenses = await expense_service.list_by_organization(db, user.organization_id)
    else:
        expenses = await expense_service.list_all(db)
    return [ExpenseResponse.model_validate(e) for e in expenses]


@router.post("/bulk", response_model=list[ExpenseResponse])
async def create_expenses_bulk(
    data: list[ExpenseCreate],
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    expenses = await expense_service.create_many(db, data)
    return [ExpenseResponse.model_validate(e) for e in expenses]


@router.get("/{id}", response_model=ExpenseResponse)
async def get_expense(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    expense = await expense_service.get_or_404(db, id)
    return ExpenseResponse.model_validate(expense)


@router.patch("/{id}", response_model=ExpenseResponse)
async def update_expense(
    id: UUID,
    data: ExpenseUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    expense = await expense_service.update(db, id, data)
    return ExpenseResponse.model_validate(expense)


@router.delete("/{id}", status_code=204)
async def delete_expense(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await expense_service.delete(db, id)
