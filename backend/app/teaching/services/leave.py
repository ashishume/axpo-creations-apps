"""Leave service: business logic for leave types, balances, and requests."""
from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.teaching.models.leave import LeaveType, LeaveBalance, LeaveRequest
from app.teaching.schemas.leave import (
    LeaveTypeCreate,
    LeaveTypeUpdate,
    LeaveBalanceCreate,
    LeaveBalanceUpdate,
    LeaveRequestCreate,
    LeaveRequestUpdate,
    LeaveRequestReview,
)
from app.teaching.repositories.leave import leave_repository
from app.teaching.repositories.session import SessionRepository

session_repository = SessionRepository()


def _days_between(from_date: date, to_date: date) -> int:
    """Return inclusive days count between from_date and to_date."""
    if to_date < from_date:
        return 0
    return (to_date - from_date).days + 1


class LeaveService:
    # ----- Leave Type -----

    async def create_leave_type(
        self, db: AsyncSession, data: LeaveTypeCreate
    ) -> LeaveType:
        leave_type = LeaveType(**data.model_dump())
        return await leave_repository.add_leave_type(db, leave_type)

    async def get_leave_type(self, db: AsyncSession, id: UUID) -> LeaveType | None:
        return await leave_repository.get_leave_type(db, id)

    async def get_leave_type_or_404(self, db: AsyncSession, id: UUID) -> LeaveType:
        lt = await leave_repository.get_leave_type(db, id)
        if not lt:
            raise NotFoundError("Leave type not found")
        return lt

    async def list_leave_types(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        applicable_to: str | None = None,
        active_only: bool = True,
    ) -> list[LeaveType]:
        return await leave_repository.list_leave_types(
            db, session_id, applicable_to=applicable_to, active_only=active_only
        )

    async def update_leave_type(
        self, db: AsyncSession, id: UUID, data: LeaveTypeUpdate
    ) -> LeaveType:
        leave_type = await self.get_leave_type_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(leave_type, k, v)
        return await leave_repository.update_leave_type(db, leave_type)

    async def delete_leave_type(self, db: AsyncSession, id: UUID) -> None:
        leave_type = await self.get_leave_type_or_404(db, id)
        await leave_repository.delete_leave_type(db, leave_type)

    # ----- Leave Balance -----

    async def get_balance(
        self,
        db: AsyncSession,
        staff_id: UUID,
        leave_type_id: UUID,
        year: str,
    ) -> LeaveBalance | None:
        return await leave_repository.get_balance(
            db, staff_id, leave_type_id, year
        )

    async def list_balances_for_staff(
        self, db: AsyncSession, staff_id: UUID, year: str | None = None
    ) -> list[LeaveBalance]:
        return await leave_repository.list_balances_for_staff(
            db, staff_id, year=year
        )

    async def create_balance(
        self, db: AsyncSession, data: LeaveBalanceCreate
    ) -> LeaveBalance:
        balance = LeaveBalance(**data.model_dump())
        return await leave_repository.add_balance(db, balance)

    async def update_balance(
        self, db: AsyncSession, id: UUID, data: LeaveBalanceUpdate
    ) -> LeaveBalance:
        balance = await leave_repository.get_balance_by_id(db, id)
        if not balance:
            raise NotFoundError("Leave balance not found")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(balance, k, v)
        return await leave_repository.update_balance(db, balance)

    async def initialize_balances_for_staff(
        self, db: AsyncSession, staff_id: UUID, session_id: UUID, year: str
    ) -> list[LeaveBalance]:
        """Create balance rows for all staff-applicable leave types for the given year."""
        leave_types = await leave_repository.list_leave_types(
            db, session_id, applicable_to="staff", active_only=True
        )
        if not leave_types:
            raise ValidationError(
                "No staff leave types configured for this session. Add leave types in the Leave Types tab first."
            )
        out = []
        for lt in leave_types:
            existing = await leave_repository.get_balance(
                db, staff_id, lt.id, year
            )
            if existing:
                out.append(existing)
                continue
            balance = LeaveBalance(
                staff_id=staff_id,
                leave_type_id=lt.id,
                year=year,
                total_days=lt.max_days_per_year or 0,
                used_days=0,
            )
            out.append(await leave_repository.add_balance(db, balance))
        return out

    # ----- Leave Request -----

    async def apply_leave(
        self, db: AsyncSession, data: LeaveRequestCreate
    ) -> LeaveRequest:
        if data.to_date < data.from_date:
            raise ValidationError("To date must be on or after from date")
        today = date.today()
        if data.from_date < today:
            raise ValidationError("From date cannot be in the past")
        days_count = _days_between(data.from_date, data.to_date)
        if days_count != data.days_count:
            raise ValidationError(
                f"Days count must be {days_count} for the given date range"
            )

        # If staff and leave type is deductible, check balance
        if data.staff_id and data.leave_type_id:
            session = await session_repository.get(db, data.session_id)
            if session:
                year = session.year
                balance = await leave_repository.get_balance(
                    db, data.staff_id, data.leave_type_id, year
                )
                if balance and (balance.total_days - balance.used_days) < days_count:
                    raise ValidationError(
                        "Insufficient leave balance for this leave type"
                    )
                leave_type = await leave_repository.get_leave_type(
                    db, data.leave_type_id
                )
                if leave_type and leave_type.max_days_per_year and balance:
                    if balance.used_days + days_count > leave_type.max_days_per_year:
                        raise ValidationError(
                            "Leave request exceeds maximum days for this leave type"
                        )

        request = LeaveRequest(**data.model_dump(), status="pending")
        return await leave_repository.add_leave_request(db, request)

    async def get_leave_request(
        self, db: AsyncSession, id: UUID
    ) -> LeaveRequest | None:
        return await leave_repository.get_leave_request(db, id)

    async def get_leave_request_or_404(
        self, db: AsyncSession, id: UUID
    ) -> LeaveRequest:
        req = await leave_repository.get_leave_request(db, id)
        if not req:
            raise NotFoundError("Leave request not found")
        return req

    async def list_leave_requests(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        status: str | None = None,
        applicant_type: str | None = None,
        staff_id: UUID | None = None,
        student_id: UUID | None = None,
    ) -> list[LeaveRequest]:
        return await leave_repository.list_leave_requests(
            db,
            session_id,
            status=status,
            applicant_type=applicant_type,
            staff_id=staff_id,
            student_id=student_id,
        )

    async def list_leave_requests_paginated(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        limit: int,
        offset: int,
        status: str | None = None,
        applicant_type: str | None = None,
        staff_id: UUID | None = None,
        student_id: UUID | None = None,
    ) -> tuple[list[LeaveRequest], int]:
        total = await leave_repository.count_leave_requests(
            db,
            session_id,
            status=status,
            applicant_type=applicant_type,
            staff_id=staff_id,
            student_id=student_id,
        )
        items = await leave_repository.list_leave_requests_paginated(
            db,
            session_id,
            limit=limit,
            offset=offset,
            status=status,
            applicant_type=applicant_type,
            staff_id=staff_id,
            student_id=student_id,
        )
        return items, total

    async def update_leave_request(
        self, db: AsyncSession, id: UUID, data: LeaveRequestUpdate
    ) -> LeaveRequest:
        request = await self.get_leave_request_or_404(db, id)
        if request.status != "pending":
            raise ValidationError("Only pending leave requests can be updated")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(request, k, v)
        if request.to_date and request.from_date:
            request.days_count = _days_between(request.from_date, request.to_date)
        return await leave_repository.update_leave_request(db, request)

    async def approve_leave(
        self,
        db: AsyncSession,
        request_id: UUID,
        reviewer_id: UUID,
        data: LeaveRequestReview | None = None,
    ) -> LeaveRequest:
        request = await self.get_leave_request_or_404(db, request_id)
        if request.status != "pending":
            raise ValidationError("Only pending leave requests can be approved")
        request.status = "approved"
        request.reviewed_by = reviewer_id
        request.reviewed_at = datetime.now(timezone.utc)
        request.reviewer_remarks = data.remarks if data else None

        # Deduct from staff balance if applicable
        if request.staff_id and request.leave_type_id:
            session = await session_repository.get(db, request.session_id)
            if session:
                balance = await leave_repository.get_balance(
                    db,
                    request.staff_id,
                    request.leave_type_id,
                    session.year,
                )
                if balance:
                    balance.used_days = balance.used_days + request.days_count
                    await leave_repository.update_balance(db, balance)

        return await leave_repository.update_leave_request(db, request)

    async def reject_leave(
        self,
        db: AsyncSession,
        request_id: UUID,
        reviewer_id: UUID,
        data: LeaveRequestReview,
    ) -> LeaveRequest:
        request = await self.get_leave_request_or_404(db, request_id)
        if request.status != "pending":
            raise ValidationError("Only pending leave requests can be rejected")
        request.status = "rejected"
        request.reviewed_by = reviewer_id
        request.reviewed_at = datetime.now(timezone.utc)
        request.reviewer_remarks = data.remarks
        return await leave_repository.update_leave_request(db, request)

    async def cancel_leave(self, db: AsyncSession, request_id: UUID) -> LeaveRequest:
        request = await self.get_leave_request_or_404(db, request_id)
        if request.status == "rejected":
            raise ValidationError("Rejected leave requests cannot be cancelled")
        if request.status == "approved" and request.staff_id and request.leave_type_id:
            # Restore balance
            session = await session_repository.get(db, request.session_id)
            if session:
                balance = await leave_repository.get_balance(
                    db,
                    request.staff_id,
                    request.leave_type_id,
                    session.year,
                )
                if balance:
                    balance.used_days = max(
                        0, balance.used_days - request.days_count
                    )
                    await leave_repository.update_balance(db, balance)
        request.status = "cancelled"
        request.reviewed_by = None
        request.reviewed_at = None
        request.reviewer_remarks = None
        return await leave_repository.update_leave_request(db, request)


leave_service = LeaveService()
