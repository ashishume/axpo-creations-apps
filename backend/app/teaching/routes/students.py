"""Student and Enrollment routes."""
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
    EnrollmentCreate,
    EnrollmentUpdate,
    EnrollmentResponse,
    FeePaymentCreate,
    FeePaymentResponse,
    BulkEnrollmentCreate,
    BulkEnrollmentResponse,
)
from app.teaching.services.student import student_service, enrollment_service
from app.teaching.models.user import User
from app.teaching.org_access import enforce_session_access, enforce_school_access

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(
    prefix="/students",
    tags=["teaching-students"],
    dependencies=[Depends(require_active_org_subscription)],
)


# ============================================
# Student (Identity) Routes
# ============================================
@router.post("", response_model=StudentResponse)
async def create_student(
    data: StudentCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Create a new student identity (not enrolled in any session yet)."""
    await enforce_school_access(db, user, data.school_id)
    student = await student_service.create(db, data)
    return StudentResponse.model_validate(student)


@router.get("/{id}", response_model=StudentResponse)
async def get_student(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Get student by ID."""
    student = await student_service.get_or_404(db, id)
    await enforce_school_access(db, user, student.school_id)
    return StudentResponse.model_validate(student)


@router.patch("/{id}", response_model=StudentResponse)
async def update_student(
    id: UUID,
    data: StudentUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Update student identity information."""
    existing = await student_service.get_or_404(db, id)
    await enforce_school_access(db, user, existing.school_id)
    student = await student_service.update(db, id, data)
    return StudentResponse.model_validate(student)


@router.delete("/{id}", status_code=204)
async def delete_student(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Delete student (will cascade delete all enrollments and payments)."""
    existing = await student_service.get_or_404(db, id)
    await enforce_school_access(db, user, existing.school_id)
    await student_service.delete(db, id)


# ============================================
# Enrollment Routes
# ============================================
@router.post("/enroll", response_model=EnrollmentResponse)
async def enroll_student(
    data: EnrollmentCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Enroll an existing student in a session."""
    await enforce_session_access(db, user, data.session_id)
    enrollment = await enrollment_service.create(db, data)
    return EnrollmentResponse.model_validate(enrollment)


@router.post("/enroll-bulk", response_model=BulkEnrollmentResponse)
async def enroll_students_bulk(
    data: BulkEnrollmentCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Enroll multiple students in a session with the same fee structure."""
    await enforce_session_access(db, user, data.session_id)
    enrollments = await enrollment_service.create_bulk(db, data)
    return BulkEnrollmentResponse(
        enrolled=len(enrollments),
        enrollments=[EnrollmentResponse.model_validate(e) for e in enrollments],
    )


@router.get("/enrollments", response_model=PaginatedResponse[EnrollmentResponse])
async def list_enrollments(
    session_id: UUID | None = None,
    student_id: UUID | None = None,
    limit: int | None = None,
    offset: int = 0,
    has_filters: bool = False,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """List enrollments filtered by session or student."""
    page_size = min(limit or (FILTERED_PAGE_SIZE if has_filters else DEFAULT_PAGE_SIZE_STUDENTS), MAX_PAGE_SIZE)
    
    if session_id:
        await enforce_session_access(db, user, session_id)
        items, total = await enrollment_service.list_by_session_paginated(
            db, session_id, limit=page_size, offset=offset
        )
    elif student_id:
        student = await student_service.get_or_404(db, student_id)
        await enforce_school_access(db, user, student.school_id)
        enrollments = await enrollment_service.list_by_student(db, student_id)
        total = len(enrollments)
        items = enrollments[offset : offset + page_size]
    elif user.organization_id:
        items, total = await enrollment_service.list_by_organization_paginated(
            db, user.organization_id, limit=page_size, offset=offset
        )
    else:
        raise HTTPException(status_code=400, detail="session_id or student_id is required")
    
    return PaginatedResponse(
        items=[EnrollmentResponse.model_validate(e) for e in items],
        total=total,
        limit=page_size,
        offset=offset,
        has_more=offset + len(items) < total,
    )


@router.get("/enrollments/{id}", response_model=EnrollmentResponse)
async def get_enrollment(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Get enrollment by ID."""
    enrollment = await enrollment_service.get_or_404(db, id)
    await enforce_session_access(db, user, enrollment.session_id)
    return EnrollmentResponse.model_validate(enrollment)


@router.patch("/enrollments/{id}", response_model=EnrollmentResponse)
async def update_enrollment(
    id: UUID,
    data: EnrollmentUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Update enrollment fee structure or payment status."""
    existing = await enrollment_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    enrollment = await enrollment_service.update(db, id, data)
    return EnrollmentResponse.model_validate(enrollment)


@router.delete("/enrollments/{id}", status_code=204)
async def delete_enrollment(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Delete enrollment (will cascade delete all payments for this enrollment)."""
    existing = await enrollment_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    await enrollment_service.delete(db, id)


@router.post("/enrollments/{id}/payments", response_model=FeePaymentResponse)
async def add_enrollment_payment(
    id: UUID,
    data: FeePaymentCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Record a payment for an enrollment."""
    existing = await enrollment_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    payment = await enrollment_service.add_payment(db, id, data)
    return FeePaymentResponse.model_validate(payment)


@router.delete("/enrollments/{id}/payments/{payment_id}", status_code=204)
async def delete_enrollment_payment(
    id: UUID,
    payment_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Delete a payment from an enrollment."""
    existing = await enrollment_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    deleted = await enrollment_service.delete_payment(db, id, payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")
