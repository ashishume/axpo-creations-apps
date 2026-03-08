"""Leave management routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.schemas.leave import (
    LeaveTypeCreate,
    LeaveTypeUpdate,
    LeaveTypeResponse,
    LeaveBalanceCreate,
    LeaveBalanceUpdate,
    LeaveBalanceResponse,
    LeaveRequestCreate,
    LeaveRequestUpdate,
    LeaveRequestReview,
    LeaveRequestResponse,
)
from app.teaching.services.leave import leave_service
from app.teaching.models.user import User

router = APIRouter(prefix="/leaves", tags=["teaching-leaves"])


# ----- Leave Types -----

@router.get("/leave-types", response_model=list[LeaveTypeResponse])
async def list_leave_types(
    session_id: UUID,
    applicable_to: str | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    types = await leave_service.list_leave_types(
        db, session_id, applicable_to=applicable_to
    )
    return [LeaveTypeResponse.model_validate(t) for t in types]


@router.post("/leave-types", response_model=LeaveTypeResponse)
async def create_leave_type(
    data: LeaveTypeCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    leave_type = await leave_service.create_leave_type(db, data)
    return LeaveTypeResponse.model_validate(leave_type)


@router.get("/leave-types/{id}", response_model=LeaveTypeResponse)
async def get_leave_type(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    leave_type = await leave_service.get_leave_type_or_404(db, id)
    return LeaveTypeResponse.model_validate(leave_type)


@router.patch("/leave-types/{id}", response_model=LeaveTypeResponse)
async def update_leave_type(
    id: UUID,
    data: LeaveTypeUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    leave_type = await leave_service.update_leave_type(db, id, data)
    return LeaveTypeResponse.model_validate(leave_type)


@router.delete("/leave-types/{id}", status_code=204)
async def delete_leave_type(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await leave_service.delete_leave_type(db, id)


# ----- Leave Requests -----

@router.get("/leave-requests", response_model=list[LeaveRequestResponse])
async def list_leave_requests(
    session_id: UUID,
    status: str | None = None,
    applicant_type: str | None = None,
    staff_id: UUID | None = None,
    student_id: UUID | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    requests = await leave_service.list_leave_requests(
        db,
        session_id,
        status=status,
        applicant_type=applicant_type,
        staff_id=staff_id,
        student_id=student_id,
    )
    return [LeaveRequestResponse.model_validate(r) for r in requests]


@router.post("/leave-requests", response_model=LeaveRequestResponse)
async def apply_leave(
    data: LeaveRequestCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    request = await leave_service.apply_leave(db, data)
    return LeaveRequestResponse.model_validate(request)


@router.get("/leave-requests/{id}", response_model=LeaveRequestResponse)
async def get_leave_request(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    request = await leave_service.get_leave_request_or_404(db, id)
    return LeaveRequestResponse.model_validate(request)


@router.patch("/leave-requests/{id}", response_model=LeaveRequestResponse)
async def update_leave_request(
    id: UUID,
    data: LeaveRequestUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    request = await leave_service.update_leave_request(db, id, data)
    return LeaveRequestResponse.model_validate(request)


@router.post("/leave-requests/{id}/approve", response_model=LeaveRequestResponse)
async def approve_leave(
    id: UUID,
    data: LeaveRequestReview | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    request = await leave_service.approve_leave(db, id, user.id, data)
    return LeaveRequestResponse.model_validate(request)


@router.post("/leave-requests/{id}/reject", response_model=LeaveRequestResponse)
async def reject_leave(
    id: UUID,
    data: LeaveRequestReview,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    request = await leave_service.reject_leave(db, id, user.id, data)
    return LeaveRequestResponse.model_validate(request)


@router.post("/leave-requests/{id}/cancel", response_model=LeaveRequestResponse)
async def cancel_leave(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    request = await leave_service.cancel_leave(db, id)
    return LeaveRequestResponse.model_validate(request)


# ----- Leave Balances -----

@router.get("/leave-balances", response_model=list[LeaveBalanceResponse])
async def list_leave_balances(
    staff_id: UUID,
    year: str | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    balances = await leave_service.list_balances_for_staff(
        db, staff_id, year=year
    )
    return [LeaveBalanceResponse.model_validate(b) for b in balances]


@router.post("/leave-balances", response_model=LeaveBalanceResponse)
async def create_leave_balance(
    data: LeaveBalanceCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    balance = await leave_service.create_balance(db, data)
    return LeaveBalanceResponse.model_validate(balance)


@router.patch("/leave-balances/{id}", response_model=LeaveBalanceResponse)
async def update_leave_balance(
    id: UUID,
    data: LeaveBalanceUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    balance = await leave_service.update_balance(db, id, data)
    return LeaveBalanceResponse.model_validate(balance)


@router.post("/leave-balances/initialize", response_model=list[LeaveBalanceResponse])
async def initialize_leave_balances(
    staff_id: UUID,
    session_id: UUID,
    year: str,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    balances = await leave_service.initialize_balances_for_staff(
        db, staff_id, session_id, year
    )
    return [LeaveBalanceResponse.model_validate(b) for b in balances]
