"""Expense service: business logic and orchestration; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.billing.models.expense import Expense
from app.billing.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.billing.repositories.expense import expense_repository


class ExpenseService:
    """Expense application service."""

    async def create(self, db: AsyncSession, data: ExpenseCreate) -> Expense:
        expense = Expense(**data.model_dump())
        return await expense_repository.add(db, expense)

    async def get(self, db: AsyncSession, id: UUID) -> Expense | None:
        return await expense_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Expense:
        expense = await expense_repository.get(db, id)
        if not expense:
            raise NotFoundError("Expense not found")
        return expense

    async def list_all(self, db: AsyncSession) -> list[Expense]:
        return await expense_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: ExpenseUpdate) -> Expense:
        expense = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(expense, k, v)
        return await expense_repository.update(db, expense)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        expense = await self.get_or_404(db, id)
        await expense_repository.delete(db, expense)


expense_service = ExpenseService()
