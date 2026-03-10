"""Staff service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.staff import Staff, SalaryPayment
from app.teaching.schemas.staff import StaffCreate, StaffUpdate, SalaryPaymentCreate, SalaryPaymentUpdate, BulkSalaryPaymentItem
from app.teaching.repositories.staff import staff_repository


class StaffService:
    async def create(self, db: AsyncSession, data: StaffCreate) -> Staff:
        staff = Staff(**data.model_dump())
        return await staff_repository.add(db, staff)

    async def create_many(self, db: AsyncSession, items: list[StaffCreate]) -> list[Staff]:
        out = []
        for d in items:
            staff = Staff(**d.model_dump())
            out.append(await staff_repository.add(db, staff))
        return out

    async def get(self, db: AsyncSession, id: UUID) -> Staff | None:
        return await staff_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Staff:
        staff = await staff_repository.get(db, id)
        if not staff:
            raise NotFoundError("Staff not found")
        return staff

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Staff]:
        return await staff_repository.list_by_session(db, session_id)

    async def list_all(self, db: AsyncSession) -> list[Staff]:
        return await staff_repository.list_all(db)

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[Staff]:
        return await staff_repository.list_by_organization(db, organization_id)

    async def list_by_session_paginated(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[Staff], int]:
        total = await staff_repository.count_by_session(db, session_id)
        items = await staff_repository.list_by_session_paginated(
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
    ) -> tuple[list[Staff], int]:
        total = await staff_repository.count_by_organization(db, organization_id)
        items = await staff_repository.list_by_organization_paginated(
            db, organization_id, limit=limit, offset=offset
        )
        return items, total

    async def update(self, db: AsyncSession, id: UUID, data: StaffUpdate) -> Staff:
        staff = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(staff, k, v)
        return await staff_repository.update(db, staff)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        staff = await self.get_or_404(db, id)
        await staff_repository.delete(db, staff)

    async def add_salary_payment(
        self, db: AsyncSession, staff_id: UUID, data: SalaryPaymentCreate
    ) -> SalaryPayment:
        await self.get_or_404(db, staff_id)
        return await staff_repository.add_salary_payment(
            db,
            staff_id,
            month=data.month,
            amount=data.amount,
            status=data.status,
            payment_date=data.payment_date,
            method=data.method,
            due_date=data.due_date,
        )

    async def update_salary_payment(
        self, db: AsyncSession, staff_id: UUID, payment_id: UUID, data: SalaryPaymentUpdate
    ) -> SalaryPayment | None:
        await self.get_or_404(db, staff_id)
        return await staff_repository.update_salary_payment(
            db,
            payment_id,
            staff_id,
            paid_amount=data.paid_amount,
            status=data.status,
            payment_date=data.payment_date,
            method=data.method,
        )

    async def add_salary_payments_bulk(
        self, db: AsyncSession, items: list[BulkSalaryPaymentItem]
    ) -> list[SalaryPayment]:
        staff_ids = {item.staff_id for item in items}
        for sid in staff_ids:
            await self.get_or_404(db, sid)
        out = []
        for item in items:
            payment = await staff_repository.add_salary_payment(
                db,
                item.staff_id,
                month=item.month,
                amount=item.amount,
                status=item.status,
                payment_date=item.payment_date,
                method=item.method,
                due_date=item.due_date,
            )
            out.append(payment)
        return out

    async def delete_salary_payment(
        self, db: AsyncSession, staff_id: UUID, payment_id: UUID
    ) -> bool:
        await self.get_or_404(db, staff_id)
        return await staff_repository.delete_salary_payment(db, payment_id, staff_id)


staff_service = StaffService()
