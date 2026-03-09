"""Expense repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.expense import Expense
from app.teaching.models.school import School, Session


class ExpenseRepository:
    async def get(self, db: AsyncSession, id: UUID) -> Expense | None:
        result = await db.execute(select(Expense).where(Expense.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Expense]:
        result = await db.execute(select(Expense).order_by(Expense.date.desc()))
        return list(result.scalars().all())

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Expense]:
        result = await db.execute(
            select(Expense).where(Expense.session_id == session_id).order_by(Expense.date.desc())
        )
        return list(result.scalars().all())

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[Expense]:
        result = await db.execute(
            select(Expense)
            .join(Session, Expense.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
            .order_by(Expense.date.desc())
        )
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, expense: Expense) -> Expense:
        db.add(expense)
        await db.flush()
        await db.refresh(expense)
        return expense

    async def update(self, db: AsyncSession, expense: Expense) -> Expense:
        await db.flush()
        await db.refresh(expense)
        return expense

    async def delete(self, db: AsyncSession, expense: Expense) -> None:
        await db.delete(expense)
        await db.flush()


expense_repository = ExpenseRepository()
