"""Staff repository: DB operations only."""
from datetime import date
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.staff import Staff, SalaryPayment
from app.teaching.models.school import School, Session


class StaffRepository:
    async def get(self, db: AsyncSession, id: UUID) -> Staff | None:
        result = await db.execute(select(Staff).where(Staff.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Staff]:
        result = await db.execute(select(Staff).order_by(Staff.created_at.desc()))
        return list(result.scalars().all())

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Staff]:
        result = await db.execute(
            select(Staff).where(Staff.session_id == session_id).order_by(Staff.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[Staff]:
        result = await db.execute(
            select(Staff)
            .join(Session, Staff.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
            .order_by(Staff.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_by_session(self, db: AsyncSession, session_id: UUID) -> int:
        result = await db.execute(select(func.count()).select_from(Staff).where(Staff.session_id == session_id))
        return result.scalar() or 0

    async def list_by_session_paginated(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> list[Staff]:
        result = await db.execute(
            select(Staff)
            .where(Staff.session_id == session_id)
            .order_by(Staff.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def count_by_organization(self, db: AsyncSession, organization_id: UUID) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(Staff)
            .join(Session, Staff.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
        )
        return result.scalar() or 0

    async def list_by_organization_paginated(
        self,
        db: AsyncSession,
        organization_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> list[Staff]:
        result = await db.execute(
            select(Staff)
            .join(Session, Staff.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
            .order_by(Staff.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, staff: Staff) -> Staff:
        db.add(staff)
        await db.flush()
        await db.refresh(staff)
        return staff

    async def update(self, db: AsyncSession, staff: Staff) -> Staff:
        await db.flush()
        await db.refresh(staff)
        return staff

    async def delete(self, db: AsyncSession, staff: Staff) -> None:
        await db.delete(staff)
        await db.flush()

    async def add_salary_payment(
        self,
        db: AsyncSession,
        staff_id: UUID,
        *,
        month: str,
        amount,
        status: str = "Paid",
        payment_date: date | None = None,
        method: str | None = None,
        due_date: str | None = None,
    ) -> SalaryPayment:
        from decimal import Decimal
        due = due_date or f"{month}-05"
        try:
            due_parsed = date.fromisoformat(due) if isinstance(due, str) else due
        except (TypeError, ValueError):
            due_parsed = date.fromisoformat(f"{month}-05")
        payment = SalaryPayment(
            staff_id=staff_id,
            month=month,
            expected_amount=Decimal(str(amount)),
            paid_amount=Decimal(str(amount)),
            status=status,
            due_date=due_parsed,
            payment_date=payment_date,
            method=method,
        )
        db.add(payment)
        await db.flush()
        await db.refresh(payment)
        return payment

    async def update_salary_payment(
        self,
        db: AsyncSession,
        payment_id: UUID,
        staff_id: UUID,
        *,
        paid_amount=None,
        status: str | None = None,
        payment_date=None,
        method: str | None = None,
    ) -> SalaryPayment | None:
        result = await db.execute(
            select(SalaryPayment).where(
                SalaryPayment.id == payment_id,
                SalaryPayment.staff_id == staff_id,
            )
        )
        payment = result.scalar_one_or_none()
        if not payment:
            return None
        if paid_amount is not None:
            payment.paid_amount = paid_amount
        if status is not None:
            payment.status = status
        if payment_date is not None:
            payment.payment_date = payment_date
        if method is not None:
            payment.method = method
        await db.flush()
        await db.refresh(payment)
        return payment

    async def delete_salary_payment(
        self, db: AsyncSession, payment_id: UUID, staff_id: UUID
    ) -> bool:
        result = await db.execute(
            select(SalaryPayment).where(
                SalaryPayment.id == payment_id,
                SalaryPayment.staff_id == staff_id,
            )
        )
        payment = result.scalar_one_or_none()
        if not payment:
            return False
        await db.delete(payment)
        await db.flush()
        return True


staff_repository = StaffRepository()
