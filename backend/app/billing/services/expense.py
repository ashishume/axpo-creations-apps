"""Expense CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.billing.models.expense import Expense
from app.billing.schemas.expense import ExpenseCreate, ExpenseUpdate


class ExpenseService:
    async def create(self, db: AsyncSession, data: ExpenseCreate) -> Expense:
        expense = Expense(**data.model_dump())
        db.add(expense)
        await db.flush()
        await db.refresh(expense)
        return expense

    async def get(self, db: AsyncSession, id: UUID) -> Expense | None:
        result = await db.execute(select(Expense).where(Expense.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Expense:
        expense = await self.get(db, id)
        if not expense:
            raise NotFoundError("Expense not found")
        return expense

    async def list_all(self, db: AsyncSession) -> list[Expense]:
        result = await db.execute(select(Expense).order_by(Expense.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: ExpenseUpdate) -> Expense:
        expense = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(expense, k, v)
        await db.flush()
        await db.refresh(expense)
        return expense

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        expense = await self.get_or_404(db, id)
        await db.delete(expense)
        await db.flush()


expense_service = ExpenseService()
