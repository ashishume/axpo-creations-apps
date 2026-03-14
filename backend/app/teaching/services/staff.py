"""Staff service: business logic; uses repository for DB."""
import calendar
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.teaching.models.staff import Staff, SalaryPayment
from app.teaching.models.leave import LeaveRequest
from app.teaching.schemas.staff import (
    StaffCreate,
    StaffUpdate,
    SalaryPaymentCreate,
    SalaryPaymentUpdate,
    BulkSalaryPaymentItem,
    LeaveSummaryResponse,
    TransferStaffCreate,
)
from app.teaching.repositories.staff import staff_repository


def _get_days_in_month(year: int, month: int) -> int:
    """Return number of days in a given month."""
    return calendar.monthrange(year, month)[1]


def _calculate_salary_breakdown(
    monthly_salary: Decimal,
    per_day_salary: Decimal | None,
    allowed_leaves: int,
    leaves_taken: int,
    days_worked: int,
    extra_allowance: Decimal,
    extra_deduction: Decimal,
) -> tuple[Decimal, Decimal, int, Decimal]:
    """
    Calculate salary breakdown.
    Returns: (per_day_rate, leave_deduction, excess_leaves, calculated_salary)
    """
    per_day = per_day_salary if per_day_salary else (monthly_salary / Decimal("30"))
    excess_leaves = max(0, leaves_taken - allowed_leaves)
    leave_deduction = Decimal(str(excess_leaves)) * per_day
    calculated_salary = monthly_salary - leave_deduction - extra_deduction + extra_allowance
    return per_day, leave_deduction, excess_leaves, calculated_salary


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

    async def delete_all_by_session(self, db: AsyncSession, session_id: UUID) -> int:
        """Delete all staff in the given session. Returns count deleted."""
        return await staff_repository.delete_all_by_session(db, session_id)

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Staff]:
        return await staff_repository.list_by_session(db, session_id)

    async def list_all(self, db: AsyncSession) -> list[Staff]:
        return await staff_repository.list_all(db)

    async def list_all_paginated(
        self,
        db: AsyncSession,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[Staff], int]:
        """Return (items, total) for DB-level pagination when no session/org filter."""
        total = await staff_repository.count_all(db)
        items = await staff_repository.list_all_paginated(
            db, limit=limit, offset=offset
        )
        return items, total

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[Staff]:
        return await staff_repository.list_by_organization(db, organization_id)

    async def list_by_session_paginated(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
        role: str | None = None,
    ) -> tuple[list[Staff], int]:
        total = await staff_repository.count_by_session(
            db, session_id, search=search, role=role
        )
        items = await staff_repository.list_by_session_paginated(
            db,
            session_id,
            limit=limit,
            offset=offset,
            search=search,
            role=role,
        )
        return items, total

    async def transfer_to_session(
        self, db: AsyncSession, data: TransferStaffCreate
    ) -> int:
        """Copy staff from one session to another. Copies salary and other details; does not copy salary payment records."""
        from_session_id = data.from_session_id
        to_session_id = data.to_session_id
        count = 0
        for staff_id in data.staff_ids:
            staff = await staff_repository.get(db, staff_id)
            if not staff or staff.session_id != from_session_id:
                continue
            new_staff = Staff(
                session_id=to_session_id,
                user_id=None,
                name=staff.name,
                employee_id=staff.employee_id,
                role=staff.role,
                monthly_salary=staff.monthly_salary,
                subject_or_grade=staff.subject_or_grade,
                phone=staff.phone,
                email=staff.email,
                address=staff.address,
                salary_due_day=staff.salary_due_day,
                allowed_leaves_per_month=staff.allowed_leaves_per_month,
                per_day_salary=staff.per_day_salary,
                classes_subjects=staff.classes_subjects,
            )
            await staff_repository.add(db, new_staff)
            count += 1
        return count

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

    async def get_leave_summary(
        self, db: AsyncSession, staff_id: UUID, month: str
    ) -> LeaveSummaryResponse:
        """
        Get leave summary for a staff member for a specific month.
        Returns leaves taken (approved), days in month, calculated days worked, etc.
        """
        staff = await self.get_or_404(db, staff_id)
        
        # Parse month (YYYY-MM)
        year, month_num = map(int, month.split("-"))
        days_in_month = _get_days_in_month(year, month_num)
        
        # Get first and last day of the month
        first_day = date(year, month_num, 1)
        last_day = date(year, month_num, days_in_month)
        
        # Query approved leave requests for this staff in this month
        result = await db.execute(
            select(LeaveRequest).where(
                and_(
                    LeaveRequest.staff_id == staff_id,
                    LeaveRequest.status == "approved",
                    LeaveRequest.from_date <= last_day,
                    LeaveRequest.to_date >= first_day,
                )
            )
        )
        leave_requests = list(result.scalars().all())
        
        # Calculate total leave days in this month
        leaves_taken = 0
        for req in leave_requests:
            # Calculate overlapping days with this month
            overlap_start = max(req.from_date, first_day)
            overlap_end = min(req.to_date, last_day)
            if overlap_end >= overlap_start:
                leaves_taken += (overlap_end - overlap_start).days + 1
        
        allowed_leaves = staff.allowed_leaves_per_month
        excess_leaves = max(0, leaves_taken - allowed_leaves)
        days_worked = days_in_month - leaves_taken
        
        per_day = staff.per_day_salary if staff.per_day_salary else (staff.monthly_salary / Decimal("30"))
        leave_deduction = Decimal(str(excess_leaves)) * per_day
        
        return LeaveSummaryResponse(
            staff_id=staff_id,
            month=month,
            leaves_taken=leaves_taken,
            days_in_month=days_in_month,
            days_worked=days_worked,
            allowed_leaves=allowed_leaves,
            excess_leaves=excess_leaves,
            per_day_salary=per_day,
            leave_deduction=leave_deduction,
        )

    async def add_salary_payment(
        self, db: AsyncSession, staff_id: UUID, data: SalaryPaymentCreate
    ) -> SalaryPayment:
        staff = await self.get_or_404(db, staff_id)

        # Check if there's an existing payment for this month
        existing_payment = await staff_repository.get_salary_payment_for_month(db, staff_id, data.month)
        
        # Calculate salary breakdown
        per_day, leave_deduction, excess_leaves, calculated_salary = _calculate_salary_breakdown(
            monthly_salary=staff.monthly_salary,
            per_day_salary=staff.per_day_salary,
            allowed_leaves=staff.allowed_leaves_per_month,
            leaves_taken=data.leaves_taken,
            days_worked=data.days_worked,
            extra_allowance=data.extra_allowance,
            extra_deduction=data.extra_deduction,
        )
        
        # Use provided paid_amount or fall back to expected amount
        paid_amount = data.paid_amount if data.paid_amount is not None else data.amount
        
        if existing_payment:
            # Update existing payment for partial payment scenario
            existing_payment.paid_amount = paid_amount
            existing_payment.status = data.status
            existing_payment.payment_date = data.payment_date
            existing_payment.method = data.method
            return await staff_repository.update(db, existing_payment)
        
        return await staff_repository.add_salary_payment(
            db,
            staff_id,
            month=data.month,
            amount=data.amount,
            paid_amount=paid_amount,
            status=data.status,
            payment_date=data.payment_date,
            method=data.method,
            due_date=data.due_date,
            # Leave tracking
            days_worked=data.days_worked,
            leaves_taken=data.leaves_taken,
            allowed_leaves=staff.allowed_leaves_per_month,
            excess_leaves=excess_leaves,
            leave_deduction=leave_deduction,
            # Extra allowance/deduction
            extra_allowance=data.extra_allowance,
            allowance_note=data.allowance_note,
            extra_deduction=data.extra_deduction,
            deduction_note=data.deduction_note,
            # Calculated salary
            calculated_salary=calculated_salary,
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
            days_worked=data.days_worked,
            leaves_taken=data.leaves_taken,
            extra_allowance=data.extra_allowance,
            allowance_note=data.allowance_note,
            extra_deduction=data.extra_deduction,
            deduction_note=data.deduction_note,
        )

    async def add_salary_payments_bulk(
        self, db: AsyncSession, items: list[BulkSalaryPaymentItem]
    ) -> list[SalaryPayment]:
        # Pre-fetch all staff members
        staff_map: dict[UUID, Staff] = {}
        for sid in {item.staff_id for item in items}:
            staff = await self.get_or_404(db, sid)
            staff_map[sid] = staff

        # Reject if any employee already has a payment for that month
        for item in items:
            if await staff_repository.has_salary_payment_for_month(db, item.staff_id, item.month):
                staff = staff_map[item.staff_id]
                raise ConflictError(
                    f"Employee {staff.name} already has a salary payment for {item.month}. Only one payment per employee per month is allowed."
                )

        out = []
        for item in items:
            staff = staff_map[item.staff_id]

            # Calculate salary breakdown
            per_day, leave_deduction, excess_leaves, calculated_salary = _calculate_salary_breakdown(
                monthly_salary=staff.monthly_salary,
                per_day_salary=staff.per_day_salary,
                allowed_leaves=staff.allowed_leaves_per_month,
                leaves_taken=item.leaves_taken,
                days_worked=item.days_worked,
                extra_allowance=item.extra_allowance,
                extra_deduction=item.extra_deduction,
            )
            
            payment = await staff_repository.add_salary_payment(
                db,
                item.staff_id,
                month=item.month,
                amount=item.amount,
                status=item.status,
                payment_date=item.payment_date,
                method=item.method,
                due_date=item.due_date,
                # Leave tracking
                days_worked=item.days_worked,
                leaves_taken=item.leaves_taken,
                allowed_leaves=staff.allowed_leaves_per_month,
                excess_leaves=excess_leaves,
                leave_deduction=leave_deduction,
                # Extra allowance/deduction
                extra_allowance=item.extra_allowance,
                allowance_note=item.allowance_note,
                extra_deduction=item.extra_deduction,
                deduction_note=item.deduction_note,
                # Calculated salary
                calculated_salary=calculated_salary,
            )
            out.append(payment)
        return out

    async def delete_salary_payment(
        self, db: AsyncSession, staff_id: UUID, payment_id: UUID
    ) -> bool:
        await self.get_or_404(db, staff_id)
        return await staff_repository.delete_salary_payment(db, payment_id, staff_id)


staff_service = StaffService()
