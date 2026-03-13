"""Staff routes."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.teaching.dependencies import (
    get_teaching_db_session,
    get_current_teaching_user,
    require_active_org_subscription,
    require_teaching_permission,
)
from app.teaching.pagination import DEFAULT_PAGE_SIZE_STAFF, FILTERED_PAGE_SIZE, MAX_PAGE_SIZE
from app.teaching.schemas.pagination import PaginatedResponse
from app.teaching.schemas.staff import (
    StaffCreate,
    StaffUpdate,
    StaffResponse,
    SalaryPaymentCreate,
    SalaryPaymentResponse,
    SalaryPaymentUpdate,
    BulkSalaryPaymentItem,
    LeaveSummaryResponse,
    TransferStaffCreate,
    TransferStaffResponse,
)
from app.teaching.services.staff import staff_service
from app.teaching.models.user import User
from app.teaching.org_access import enforce_session_access

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(
    prefix="/staff",
    tags=["teaching-staff"],
    dependencies=[Depends(require_active_org_subscription)],
)


@router.post("", response_model=StaffResponse)
async def create_staff(
    data: StaffCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await enforce_session_access(db, user, data.session_id)
    staff = await staff_service.create(db, data)
    return StaffResponse.model_validate(staff)


@router.delete("", status_code=200)
async def delete_all_staff_by_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Delete all staff in the given session. Requires session_id query param."""
    await enforce_session_access(db, user, session_id)
    deleted = await staff_service.delete_all_by_session(db, session_id)
    return {"deleted": deleted}


@router.get("", response_model=PaginatedResponse[StaffResponse])
async def list_staff(
    session_id: UUID | None = None,
    limit: int | None = None,
    offset: int = 0,
    has_filters: bool = False,
    search: str | None = None,
    role: str | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    page_size = min(limit or (FILTERED_PAGE_SIZE if has_filters else DEFAULT_PAGE_SIZE_STAFF), MAX_PAGE_SIZE)
    if session_id:
        await enforce_session_access(db, user, session_id)
        items, total = await staff_service.list_by_session_paginated(
            db,
            session_id,
            limit=page_size,
            offset=offset,
            search=search.strip() if search else None,
            role=role or None,
        )
    elif user.organization_id:
        items, total = await staff_service.list_by_organization_paginated(
            db, user.organization_id, limit=page_size, offset=offset
        )
    else:
        staff_list = await staff_service.list_all(db)
        total = len(staff_list)
        items = staff_list[offset : offset + page_size]
    return PaginatedResponse(
        items=[StaffResponse.model_validate(s) for s in items],
        total=total,
        limit=page_size,
        offset=offset,
        has_more=offset + len(items) < total,
    )


@router.post("/bulk", response_model=list[StaffResponse])
async def create_staff_bulk(
    data: list[StaffCreate],
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    session_ids = {d.session_id for d in data}
    for sid in session_ids:
        await enforce_session_access(db, user, sid)
    staff_list = await staff_service.create_many(db, data)
    return [StaffResponse.model_validate(s) for s in staff_list]


@router.post("/salary-payments/bulk", response_model=list[SalaryPaymentResponse])
async def add_salary_payments_bulk(
    data: list[BulkSalaryPaymentItem],
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("salary:manage")),
):
    """Add bulk salary payments. Requires salary:manage permission."""
    staff_ids = {item.staff_id for item in data}
    for sid in staff_ids:
        staff = await staff_service.get_or_404(db, sid)
        await enforce_session_access(db, user, staff.session_id)
    payments = await staff_service.add_salary_payments_bulk(db, data)
    return [SalaryPaymentResponse.model_validate(p) for p in payments]


@router.post("/transfer", response_model=TransferStaffResponse)
async def transfer_staff_to_session(
    data: TransferStaffCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Copy staff from one session to another. Copies salary and other details; salary payment records are not copied."""
    await enforce_session_access(db, user, data.from_session_id)
    await enforce_session_access(db, user, data.to_session_id)
    transferred = await staff_service.transfer_to_session(db, data)
    return TransferStaffResponse(transferred=transferred)


@router.get("/{id}", response_model=StaffResponse)
async def get_staff(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    staff = await staff_service.get_or_404(db, id)
    await enforce_session_access(db, user, staff.session_id)
    return StaffResponse.model_validate(staff)


@router.patch("/{id}", response_model=StaffResponse)
async def update_staff(
    id: UUID,
    data: StaffUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await staff_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    staff = await staff_service.update(db, id, data)
    return StaffResponse.model_validate(staff)


@router.delete("/{id}", status_code=204)
async def delete_staff(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await staff_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    await staff_service.delete(db, id)


@router.get("/{id}/leave-summary/{month}", response_model=LeaveSummaryResponse)
async def get_staff_leave_summary(
    id: UUID,
    month: str,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """
    Get leave summary for a staff member for a specific month (YYYY-MM format).
    Returns leaves taken, days worked, deduction info based on approved leaves.
    """
    existing = await staff_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    return await staff_service.get_leave_summary(db, id, month)


@router.post("/{id}/payments", response_model=SalaryPaymentResponse)
async def add_staff_salary_payment(
    id: UUID,
    data: SalaryPaymentCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("salary:manage")),
):
    """Add salary payment. Requires salary:manage permission."""
    existing = await staff_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    payment = await staff_service.add_salary_payment(db, id, data)
    return SalaryPaymentResponse.model_validate(payment)


@router.patch("/{id}/payments/{payment_id}", response_model=SalaryPaymentResponse)
async def update_staff_salary_payment(
    id: UUID,
    payment_id: UUID,
    data: SalaryPaymentUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("salary:manage")),
):
    """Update salary payment. Requires salary:manage permission."""
    existing = await staff_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    payment = await staff_service.update_salary_payment(db, id, payment_id, data)
    if not payment:
        raise HTTPException(status_code=404, detail="Salary payment not found")
    return SalaryPaymentResponse.model_validate(payment)


@router.delete("/{id}/payments/{payment_id}", status_code=204)
async def delete_staff_salary_payment(
    id: UUID,
    payment_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("salary:manage")),
):
    """Delete salary payment. Requires salary:manage permission."""
    existing = await staff_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    deleted = await staff_service.delete_salary_payment(db, id, payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Salary payment not found")
