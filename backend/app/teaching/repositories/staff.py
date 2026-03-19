"""Staff repository: DB operations only."""
from datetime import date
from uuid import UUID

from sqlalchemy import select, func, or_, and_, delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.staff import Staff, SalaryPayment
from app.teaching.models.school import School, Session


def _search_words(search: str) -> list[str]:
    """Split search into non-empty words for basic fuzzy matching."""
    if not search or not search.strip():
        return []
    return [w.strip() for w in search.strip().split() if w.strip()]


def _escape_like(value: str) -> str:
    """Escape % and _ for use in SQL LIKE/ILIKE patterns."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class StaffRepository:
    async def get(self, db: AsyncSession, id: UUID) -> Staff | None:
        result = await db.execute(select(Staff).where(Staff.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Staff]:
        result = await db.execute(select(Staff).order_by(Staff.created_at.desc()))
        return list(result.scalars().all())

    async def count_all(self, db: AsyncSession) -> int:
        result = await db.execute(select(func.count()).select_from(Staff))
        return result.scalar() or 0

    async def list_all_paginated(
        self,
        db: AsyncSession,
        *,
        limit: int,
        offset: int,
    ) -> list[Staff]:
        result = await db.execute(
            select(Staff).order_by(Staff.created_at.desc()).limit(limit).offset(offset)
        )
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

    async def count_by_session(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        search: str | None = None,
        role: str | None = None,
        teaching_class: str | None = None,
    ) -> int:
        q = select(func.count()).select_from(Staff).where(Staff.session_id == session_id)
        if search:
            words = _search_words(search)
            if words:
                conditions = [
                    or_(
                        Staff.name.ilike(f"%{_escape_like(w)}%"),
                        Staff.employee_id.ilike(f"%{_escape_like(w)}%"),
                    )
                    for w in words
                ]
                q = q.where(and_(*conditions))
        if role:
            q = q.where(Staff.role == role)
        if teaching_class and teaching_class.strip():
            # Staff whose classes_subjects contains an entry with this class name (class_name or className)
            q = q.where(
                text(
                    "EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(staff.classes_subjects, '[]'::jsonb)) AS e "
                    "WHERE e->>'class_name' = :tc OR e->>'className' = :tc)"
                ).bindparams(tc=teaching_class.strip())
            )
        result = await db.execute(q)
        return result.scalar() or 0

    async def list_by_session_paginated(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
        role: str | None = None,
        teaching_class: str | None = None,
    ) -> list[Staff]:
        q = select(Staff).where(Staff.session_id == session_id)
        if search:
            words = _search_words(search)
            if words:
                conditions = [
                    or_(
                        Staff.name.ilike(f"%{_escape_like(w)}%"),
                        Staff.employee_id.ilike(f"%{_escape_like(w)}%"),
                    )
                    for w in words
                ]
                q = q.where(and_(*conditions))
        if role:
            q = q.where(Staff.role == role)
        if teaching_class and teaching_class.strip():
            q = q.where(
                text(
                    "EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(staff.classes_subjects, '[]'::jsonb)) AS e "
                    "WHERE e->>'class_name' = :tc OR e->>'className' = :tc)"
                ).bindparams(tc=teaching_class.strip())
            )
        q = q.order_by(Staff.created_at.desc()).limit(limit).offset(offset)
        result = await db.execute(q)
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

    async def delete_all_by_session(self, db: AsyncSession, session_id: UUID) -> int:
        """Delete all staff in the given session. Returns count deleted. Salary payments and leave data cascade."""
        result = await db.execute(delete(Staff).where(Staff.session_id == session_id))
        await db.flush()
        return result.rowcount or 0

    async def has_salary_payment_for_month(
        self, db: AsyncSession, staff_id: UUID, month: str
    ) -> bool:
        """Return True if this staff already has any payment record for the given month."""
        result = await db.execute(
            select(SalaryPayment.id).where(
                SalaryPayment.staff_id == staff_id,
                SalaryPayment.month == month,
            ).limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def get_salary_payment_for_month(
        self, db: AsyncSession, staff_id: UUID, month: str
    ) -> SalaryPayment | None:
        """Return the salary payment record for a given month if it exists."""
        result = await db.execute(
            select(SalaryPayment).where(
                SalaryPayment.staff_id == staff_id,
                SalaryPayment.month == month,
            )
        )
        return result.scalar_one_or_none()

    async def add_salary_payment(
        self,
        db: AsyncSession,
        staff_id: UUID,
        *,
        month: str,
        amount,
        paid_amount=None,
        status: str = "Paid",
        payment_date: date | None = None,
        method: str | None = None,
        due_date: str | None = None,
        # Leave tracking fields
        days_worked: int = 30,
        leaves_taken: int = 0,
        allowed_leaves: int = 1,
        excess_leaves: int = 0,
        leave_deduction=0,
        # Extra allowance/deduction
        extra_allowance=0,
        allowance_note: str | None = None,
        extra_deduction=0,
        deduction_note: str | None = None,
        # Calculated salary
        calculated_salary=None,
    ) -> SalaryPayment:
        from decimal import Decimal
        due = due_date or f"{month}-05"
        try:
            due_parsed = date.fromisoformat(due) if isinstance(due, str) else due
        except (TypeError, ValueError):
            due_parsed = date.fromisoformat(f"{month}-05")
        
        expected_amount = Decimal(str(amount))
        actual_paid = Decimal(str(paid_amount)) if paid_amount is not None else expected_amount
        calc_salary = Decimal(str(calculated_salary)) if calculated_salary is not None else expected_amount
        
        payment = SalaryPayment(
            staff_id=staff_id,
            month=month,
            expected_amount=expected_amount,
            paid_amount=actual_paid,
            status=status,
            due_date=due_parsed,
            payment_date=payment_date,
            method=method,
            # Leave tracking fields
            days_worked=days_worked,
            leaves_taken=leaves_taken,
            allowed_leaves=allowed_leaves,
            excess_leaves=excess_leaves,
            leave_deduction=Decimal(str(leave_deduction)),
            # Extra allowance/deduction
            extra_allowance=Decimal(str(extra_allowance)),
            allowance_note=allowance_note,
            extra_deduction=Decimal(str(extra_deduction)),
            deduction_note=deduction_note,
            # Calculated salary
            calculated_salary=calc_salary,
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
        # Leave tracking fields
        days_worked: int | None = None,
        leaves_taken: int | None = None,
        # Extra allowance/deduction
        extra_allowance=None,
        allowance_note: str | None = None,
        extra_deduction=None,
        deduction_note: str | None = None,
    ) -> SalaryPayment | None:
        from decimal import Decimal
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
        if days_worked is not None:
            payment.days_worked = days_worked
        if leaves_taken is not None:
            payment.leaves_taken = leaves_taken
        if extra_allowance is not None:
            payment.extra_allowance = Decimal(str(extra_allowance))
        if allowance_note is not None:
            payment.allowance_note = allowance_note
        if extra_deduction is not None:
            payment.extra_deduction = Decimal(str(extra_deduction))
        if deduction_note is not None:
            payment.deduction_note = deduction_note
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
