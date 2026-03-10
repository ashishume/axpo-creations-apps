"""Student routes."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.teaching.dependencies import (
    get_teaching_db_session,
    get_current_teaching_user,
    require_active_org_subscription,
)
from app.teaching.pagination import DEFAULT_PAGE_SIZE_STUDENTS, FILTERED_PAGE_SIZE, MAX_PAGE_SIZE
from app.teaching.schemas.pagination import PaginatedResponse
from app.teaching.schemas.student import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    FeePaymentCreate,
    FeePaymentResponse,
)
from app.teaching.services.student import student_service
from app.teaching.models.user import User
from app.teaching.org_access import enforce_session_access

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(
    prefix="/students",
    tags=["teaching-students"],
    dependencies=[Depends(require_active_org_subscription)],
)


@router.post("", response_model=StudentResponse)
async def create_student(
    data: StudentCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await enforce_session_access(db, user, data.session_id)
    student = await student_service.create(db, data)
    return StudentResponse.model_validate(student)


@router.get("", response_model=PaginatedResponse[StudentResponse])
async def list_students(
    session_id: UUID | None = None,
    limit: int | None = None,
    offset: int = 0,
    has_filters: bool = False,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    page_size = min(limit or (FILTERED_PAGE_SIZE if has_filters else DEFAULT_PAGE_SIZE_STUDENTS), MAX_PAGE_SIZE)
    if session_id:
        await enforce_session_access(db, user, session_id)
        items, total = await student_service.list_by_session_paginated(
            db, session_id, limit=page_size, offset=offset
        )
    elif user.organization_id:
        items, total = await student_service.list_by_organization_paginated(
            db, user.organization_id, limit=page_size, offset=offset
        )
    else:
        students = await student_service.list_all(db)
        total = len(students)
        items = students[offset : offset + page_size]
    return PaginatedResponse(
        items=[StudentResponse.model_validate(s) for s in items],
        total=total,
        limit=page_size,
        offset=offset,
        has_more=offset + len(items) < total,
    )


@router.post("/bulk", response_model=list[StudentResponse])
async def create_students_bulk(
    data: list[StudentCreate],
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    session_ids = {d.session_id for d in data}
    for sid in session_ids:
        await enforce_session_access(db, user, sid)
    students = await student_service.create_many(db, data)
    return [StudentResponse.model_validate(s) for s in students]


@router.get("/{id}", response_model=StudentResponse)
async def get_student(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    student = await student_service.get_or_404(db, id)
    await enforce_session_access(db, user, student.session_id)
    return StudentResponse.model_validate(student)


@router.patch("/{id}", response_model=StudentResponse)
async def update_student(
    id: UUID,
    data: StudentUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await student_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    student = await student_service.update(db, id, data)
    return StudentResponse.model_validate(student)


@router.delete("/{id}", status_code=204)
async def delete_student(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await student_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    await student_service.delete(db, id)


@router.post("/{id}/payments", response_model=FeePaymentResponse)
async def add_student_payment(
    id: UUID,
    data: FeePaymentCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await student_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    payment = await student_service.add_payment(db, id, data)
    return FeePaymentResponse.model_validate(payment)


@router.delete("/{id}/payments/{payment_id}", status_code=204)
async def delete_student_payment(
    id: UUID,
    payment_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await student_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    deleted = await student_service.delete_payment(db, id, payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")
