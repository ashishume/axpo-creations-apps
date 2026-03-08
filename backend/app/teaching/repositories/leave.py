"""Leave repository: DB operations for leave types, balances, and requests."""
from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.teaching.models.leave import LeaveType, LeaveBalance, LeaveRequest


class LeaveRepository:
    # ----- Leave Type -----

    async def get_leave_type(self, db: AsyncSession, id: UUID) -> LeaveType | None:
        result = await db.execute(select(LeaveType).where(LeaveType.id == id))
        return result.scalar_one_or_none()

    async def list_leave_types(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        applicable_to: str | None = None,
        active_only: bool = True,
    ) -> list[LeaveType]:
        q = select(LeaveType).where(LeaveType.session_id == session_id)
        if applicable_to:
            q = q.where(
                (LeaveType.applicable_to == applicable_to) | (LeaveType.applicable_to == "both")
            )
        if active_only:
            q = q.where(LeaveType.is_active == True)
        q = q.order_by(LeaveType.name)
        result = await db.execute(q)
        return list(result.scalars().all())

    async def add_leave_type(self, db: AsyncSession, leave_type: LeaveType) -> LeaveType:
        db.add(leave_type)
        await db.flush()
        await db.refresh(leave_type)
        return leave_type

    async def update_leave_type(self, db: AsyncSession, leave_type: LeaveType) -> LeaveType:
        await db.flush()
        await db.refresh(leave_type)
        return leave_type

    async def delete_leave_type(self, db: AsyncSession, leave_type: LeaveType) -> None:
        await db.delete(leave_type)
        await db.flush()

    # ----- Leave Balance -----

    async def get_balance_by_id(
        self, db: AsyncSession, id: UUID
    ) -> LeaveBalance | None:
        result = await db.execute(
            select(LeaveBalance)
            .options(selectinload(LeaveBalance.leave_type))
            .where(LeaveBalance.id == id)
        )
        return result.scalar_one_or_none()

    async def get_balance(
        self,
        db: AsyncSession,
        staff_id: UUID,
        leave_type_id: UUID,
        year: str,
    ) -> LeaveBalance | None:
        result = await db.execute(
            select(LeaveBalance)
            .where(
                LeaveBalance.staff_id == staff_id,
                LeaveBalance.leave_type_id == leave_type_id,
                LeaveBalance.year == year,
            )
        )
        return result.scalar_one_or_none()

    async def list_balances_for_staff(
        self, db: AsyncSession, staff_id: UUID, year: str | None = None
    ) -> list[LeaveBalance]:
        q = (
            select(LeaveBalance)
            .options(selectinload(LeaveBalance.leave_type))
            .where(LeaveBalance.staff_id == staff_id)
        )
        if year:
            q = q.where(LeaveBalance.year == year)
        q = q.order_by(LeaveBalance.year.desc())
        result = await db.execute(q)
        return list(result.scalars().all())

    async def add_balance(self, db: AsyncSession, balance: LeaveBalance) -> LeaveBalance:
        db.add(balance)
        await db.flush()
        await db.refresh(balance)
        return balance

    async def update_balance(self, db: AsyncSession, balance: LeaveBalance) -> LeaveBalance:
        await db.flush()
        await db.refresh(balance)
        return balance

    # ----- Leave Request -----

    async def get_leave_request(
        self, db: AsyncSession, id: UUID, *, load_relations: bool = True
    ) -> LeaveRequest | None:
        q = select(LeaveRequest).where(LeaveRequest.id == id)
        if load_relations:
            q = q.options(
                selectinload(LeaveRequest.leave_type),
                selectinload(LeaveRequest.staff),
                selectinload(LeaveRequest.student),
            )
        result = await db.execute(q)
        return result.scalar_one_or_none()

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
        q = (
            select(LeaveRequest)
            .options(selectinload(LeaveRequest.leave_type))
            .where(LeaveRequest.session_id == session_id)
        )
        if status:
            q = q.where(LeaveRequest.status == status)
        if applicant_type:
            q = q.where(LeaveRequest.applicant_type == applicant_type)
        if staff_id is not None:
            q = q.where(LeaveRequest.staff_id == staff_id)
        if student_id is not None:
            q = q.where(LeaveRequest.student_id == student_id)
        q = q.order_by(LeaveRequest.applied_at.desc())
        result = await db.execute(q)
        return list(result.scalars().all())

    async def list_pending_leave_requests(
        self, db: AsyncSession, session_id: UUID
    ) -> list[LeaveRequest]:
        return await self.list_leave_requests(db, session_id, status="pending")

    async def add_leave_request(self, db: AsyncSession, request: LeaveRequest) -> LeaveRequest:
        db.add(request)
        await db.flush()
        await db.refresh(request)
        return request

    async def update_leave_request(self, db: AsyncSession, request: LeaveRequest) -> LeaveRequest:
        await db.flush()
        await db.refresh(request)
        return request

    async def delete_leave_request(self, db: AsyncSession, request: LeaveRequest) -> None:
        await db.delete(request)
        await db.flush()


leave_repository = LeaveRepository()
