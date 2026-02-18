"""Expense CRUD service for teaching."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.teaching.models.expense import Expense
from app.teaching.schemas.expense import ExpenseCreate, ExpenseUpdate


class ExpenseService:
    async def create(self, db: AsyncSession, data: ExpenseCreate) -> Expense:
        expense = Expense(**data.model_dump())
        db.add(expense)
        await db.flush()
        await db.refresh(expense)
        return expense

    async def create_many(self, db: AsyncSession, items: list[ExpenseCreate]) -> list[Expense]:
        expenses = [Expense(**d.model_dump()) for d in items]
        for e in expenses:
            db.add(e)
        await db.flush()
        for e in expenses:
            await db.refresh(e)
        return expenses

    async def get(self, db: AsyncSession, id: UUID) -> Expense | None:
        result = await db.execute(select(Expense).where(Expense.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Expense:
        expense = await self.get(db, id)
        if not expense:
            raise NotFoundError("Expense not found")
        return expense

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Expense]:
        result = await db.execute(
            select(Expense).where(Expense.session_id == session_id).order_by(Expense.date.desc())
        )
        return list(result.scalars().all())

    async def list_all(self, db: AsyncSession) -> list[Expense]:
        result = await db.execute(select(Expense).order_by(Expense.date.desc()))
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
