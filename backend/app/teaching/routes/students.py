"""Student and Enrollment routes."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.teaching.dependencies import (
    get_teaching_db_session,
    get_current_teaching_user,
    require_active_org_subscription,
    require_teaching_permission,
    require_any_teaching_permission,
)
from app.teaching.pagination import DEFAULT_PAGE_SIZE_STUDENTS, FILTERED_PAGE_SIZE, MAX_PAGE_SIZE
from app.teaching.schemas.pagination import PaginatedResponse
from app.teaching.schemas.student import (
    StudentCreate,
    StudentCreateWithEnrollment,
    StudentUpdate,
    StudentUpdateWithEnrollment,
    StudentResponse,
    BulkStudentCreate,
    BulkStudentResponse,
    CreateStudentWithEnrollmentResponse,
    EnrollmentCreate,
    EnrollmentUpdate,
    EnrollmentResponse,
    FeePaymentCreate,
    FeePaymentResponse,
    BulkEnrollmentCreate,
    BulkEnrollmentResponse,
    EnrollmentsBulkCreate,
    EnrollmentsBulkResponse,
    TransferStudentsCreate,
    TransferStudentsResponse,
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


@router.post("/with-enrollment", response_model=CreateStudentWithEnrollmentResponse)
async def create_student_with_enrollment(
    data: StudentCreateWithEnrollment,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Create a new student identity and enroll in a session in one request."""
    await enforce_session_access(db, user, data.session_id)
    student, enrollment = await student_service.create_with_enrollment(db, data)
    return CreateStudentWithEnrollmentResponse(
        student=StudentResponse.model_validate(student),
        enrollment=EnrollmentResponse.model_validate(enrollment),
    )


@router.post("/bulk", response_model=BulkStudentResponse)
async def create_students_bulk(
    data: BulkStudentCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Create multiple student identities in one request (e.g. for CSV import)."""
    if not data.students:
        return BulkStudentResponse(students=[])
    await enforce_school_access(db, user, data.students[0].school_id)
    students = await student_service.create_bulk(db, data)
    return BulkStudentResponse(students=[StudentResponse.model_validate(s) for s in students])


@router.delete("", status_code=200)
async def delete_all_students_by_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Delete all students enrolled in the given session. Requires session_id query param."""
    await enforce_session_access(db, user, session_id)
    deleted = await student_service.delete_all_by_session(db, session_id)
    return {"deleted": deleted}


@router.get("", response_model=PaginatedResponse[StudentResponse])
async def list_students(
    limit: int | None = None,
    offset: int = 0,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """List students for the current organization (paginated, DB-level)."""
    if not user.organization_id:
        raise HTTPException(status_code=400, detail="Organization required")
    page_size = min(
        limit if limit is not None else DEFAULT_PAGE_SIZE_STUDENTS,
        MAX_PAGE_SIZE,
    )
    items, total = await student_service.list_by_organization_paginated(
        db, user.organization_id, limit=page_size, offset=offset
    )
    return PaginatedResponse(
        items=[StudentResponse.model_validate(s) for s in items],
        total=total,
        limit=page_size,
        offset=offset,
        has_more=offset + len(items) < total,
    )


# ============================================
# Enrollment Routes (MUST come before /{id})
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


@router.post("/transfer", response_model=TransferStudentsResponse)
async def transfer_students_to_session(
    data: TransferStudentsCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Copy students from one session to another. Copies enrollment and fee details from the source
    session; payment status is reset (no payments are copied)."""
    await enforce_session_access(db, user, data.from_session_id)
    await enforce_session_access(db, user, data.to_session_id)
    transferred = await enrollment_service.transfer_to_session(db, data)
    return TransferStudentsResponse(transferred=transferred)


@router.post("/enrollments/bulk", response_model=EnrollmentsBulkResponse)
async def create_enrollments_bulk(
    data: EnrollmentsBulkCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Create multiple enrollments with per-row fee structure (e.g. after bulk student import)."""
    if not data.enrollments:
        return EnrollmentsBulkResponse(enrollments=[])
    await enforce_session_access(db, user, data.enrollments[0].session_id)
    enrollments = await enrollment_service.create_bulk_enrollments(db, data)
    return EnrollmentsBulkResponse(
        enrollments=[EnrollmentResponse.model_validate(e) for e in enrollments],
    )


@router.get("/enrollments", response_model=PaginatedResponse[EnrollmentResponse])
async def list_enrollments(
    session_id: UUID | None = None,
    student_id: UUID | None = None,
    limit: int | None = None,
    offset: int = 0,
    has_filters: bool = False,
    search: str | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """List enrollments filtered by session or student."""
    page_size = min(limit or (FILTERED_PAGE_SIZE if has_filters else DEFAULT_PAGE_SIZE_STUDENTS), MAX_PAGE_SIZE)
    
    if session_id:
        await enforce_session_access(db, user, session_id)
        items, total = await enrollment_service.list_by_session_paginated(
            db,
            session_id,
            limit=page_size,
            offset=offset,
            search=search.strip() if search else None,
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
    user: User = Depends(require_teaching_permission("students:edit")),
):
    """Update enrollment fee structure or payment status. Requires students:edit (fees:record cannot change fee structure)."""
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
    user: User = Depends(require_any_teaching_permission("fees:record", "students:edit")),
):
    """Record a payment for an enrollment. Allowed with fees:record or students:edit."""
    existing = await enrollment_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    payment = await enrollment_service.add_payment(db, id, data)
    return FeePaymentResponse.model_validate(payment)


@router.delete("/enrollments/{id}/payments/{payment_id}", status_code=204)
async def delete_enrollment_payment(
    id: UUID,
    payment_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_any_teaching_permission("fees:record", "students:edit")),
):
    """Delete a payment from an enrollment. Allowed with fees:record or students:edit."""
    existing = await enrollment_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    deleted = await enrollment_service.delete_payment(db, id, payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")


# ============================================
# Student Routes (parameterized - MUST come after specific routes)
# ============================================
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


@router.patch("/{id}/with-enrollment", response_model=EnrollmentResponse)
async def update_student_with_enrollment(
    id: UUID,
    data: StudentUpdateWithEnrollment,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Update both student identity and the given enrollment in one request. Returns the updated enrollment (with student and payments)."""
    existing = await student_service.get_or_404(db, id)
    await enforce_school_access(db, user, existing.school_id)
    enrollment = await student_service.update_student_and_enrollment(db, id, data)
    await enforce_session_access(db, user, enrollment.session_id)
    return EnrollmentResponse.model_validate(enrollment)


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
