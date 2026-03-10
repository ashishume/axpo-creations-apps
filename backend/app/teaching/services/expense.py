"""Expense service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.expense import Expense
from app.teaching.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.teaching.repositories.expense import expense_repository


class ExpenseService:
    async def create(self, db: AsyncSession, data: ExpenseCreate) -> Expense:
        expense = Expense(**data.model_dump())
        return await expense_repository.add(db, expense)

    async def create_many(self, db: AsyncSession, items: list[ExpenseCreate]) -> list[Expense]:
        out = []
        for d in items:
            expense = Expense(**d.model_dump())
            out.append(await expense_repository.add(db, expense))
        return out

    async def get(self, db: AsyncSession, id: UUID) -> Expense | None:
        return await expense_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Expense:
        expense = await expense_repository.get(db, id)
        if not expense:
            raise NotFoundError("Expense not found")
        return expense

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Expense]:
        return await expense_repository.list_by_session(db, session_id)

    async def list_all(self, db: AsyncSession) -> list[Expense]:
        return await expense_repository.list_all(db)

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[Expense]:
        return await expense_repository.list_by_organization(db, organization_id)

    async def list_by_session_paginated(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[Expense], int]:
        total = await expense_repository.count_by_session(db, session_id)
        items = await expense_repository.list_by_session_paginated(
            db, session_id, limit=limit, offset=offset
        )
        return items, total

    async def list_by_organization_paginated(
        self,
        db: AsyncSession,
        organization_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[Expense], int]:
        total = await expense_repository.count_by_organization(db, organization_id)
        items = await expense_repository.list_by_organization_paginated(
            db, organization_id, limit=limit, offset=offset
        )
        return items, total

    async def update(self, db: AsyncSession, id: UUID, data: ExpenseUpdate) -> Expense:
        expense = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(expense, k, v)
        return await expense_repository.update(db, expense)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        expense = await self.get_or_404(db, id)
        await expense_repository.delete(db, expense)


expense_service = ExpenseService()
