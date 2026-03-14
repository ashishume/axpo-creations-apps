"""Student and Enrollment schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class FeePaymentCreate(BaseModel):
    date: date
    amount: Decimal
    method: str
    receipt_number: str | None = None
    fee_category: str
    month: str | None = None
    receipt_photo_url: str | None = None


class FeePaymentResponse(BaseModel):
    id: UUID
    enrollment_id: UUID
    date: date
    amount: Decimal
    method: str
    receipt_number: str | None = None
    fee_category: str
    month: str | None = None
    receipt_photo_url: str | None = None

    model_config = {"from_attributes": True}


# ============================================
# Student (Identity)
# ============================================
class StudentBase(BaseModel):
    school_id: UUID
    name: str
    student_id: str
    admission_number: str | None = None
    fee_type: str = "Regular"
    father_name: str | None = None
    mother_name: str | None = None
    guardian_phone: str | None = None
    current_address: str | None = None
    permanent_address: str | None = None
    blood_group: str | None = None
    health_issues: str | None = None
    aadhaar_number: str | None = Field(None, max_length=12, pattern=r"^\d{12}$")
    date_of_birth: date | None = None
    photo_url: str | None = None
    sibling_id: UUID | None = None
    has_sibling_discount: bool = False
    is_frozen: bool = False
    frozen_at: datetime | None = None


class StudentCreate(StudentBase):
    pass


class StudentCreateWithEnrollment(StudentBase):
    """Create student identity and enroll in a session in one request. school_id is set from session."""
    school_id: UUID | None = None  # optional; backend sets from session_id
    session_id: UUID
    class_id: UUID | None = None
    registration_fees: Decimal | None = None
    annual_fund: Decimal | None = None
    monthly_fees: Decimal | None = None
    transport_fees: Decimal | None = None
    registration_paid: bool = False
    annual_fund_paid: bool = False
    due_day_of_month: int | None = None
    late_fee_amount: Decimal | None = None
    late_fee_frequency: str | None = None


class CreateStudentWithEnrollmentResponse(BaseModel):
    """Response when creating a student and enrolling in one call."""
    student: StudentResponse
    enrollment: EnrollmentResponse


class BulkStudentCreate(BaseModel):
    students: list[StudentCreate]


class StudentUpdate(BaseModel):
    name: str | None = None
    student_id: str | None = None
    admission_number: str | None = None
    fee_type: str | None = None
    father_name: str | None = None
    mother_name: str | None = None
    guardian_phone: str | None = None
    current_address: str | None = None
    permanent_address: str | None = None
    blood_group: str | None = None
    health_issues: str | None = None
    aadhaar_number: str | None = Field(None, max_length=12, pattern=r"^\d{12}$")
    date_of_birth: date | None = None
    photo_url: str | None = None
    sibling_id: UUID | None = None
    has_sibling_discount: bool | None = None
    is_frozen: bool | None = None
    frozen_at: datetime | None = None


class StudentResponse(StudentBase):
    id: UUID
    user_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BulkStudentResponse(BaseModel):
    students: list[StudentResponse]


# ============================================
# Student Enrollment (Session-specific)
# ============================================
class EnrollmentBase(BaseModel):
    student_id: UUID
    session_id: UUID
    class_id: UUID | None = None
    registration_fees: Decimal | None = None
    annual_fund: Decimal | None = None
    monthly_fees: Decimal | None = None
    transport_fees: Decimal | None = None
    registration_paid: bool = False
    annual_fund_paid: bool = False
    due_day_of_month: int | None = None
    late_fee_amount: Decimal | None = None
    late_fee_frequency: str | None = None


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentUpdate(BaseModel):
    class_id: UUID | None = None
    registration_fees: Decimal | None = None
    annual_fund: Decimal | None = None
    monthly_fees: Decimal | None = None
    transport_fees: Decimal | None = None
    registration_paid: bool | None = None
    annual_fund_paid: bool | None = None
    due_day_of_month: int | None = None
    late_fee_amount: Decimal | None = None
    late_fee_frequency: str | None = None


class EnrollmentResponse(EnrollmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    student: StudentResponse | None = None
    payments: list[FeePaymentResponse] = []

    model_config = {"from_attributes": True}


# ============================================
# Bulk Enrollment
# ============================================
class BulkEnrollmentCreate(BaseModel):
    student_ids: list[UUID]
    session_id: UUID
    class_id: UUID | None = None
    registration_fees: Decimal | None = None
    annual_fund: Decimal | None = None
    monthly_fees: Decimal | None = None
    transport_fees: Decimal | None = None
    due_day_of_month: int | None = None
    late_fee_amount: Decimal | None = None
    late_fee_frequency: str | None = None


class BulkEnrollmentResponse(BaseModel):
    enrolled: int
    enrollments: list[EnrollmentResponse] = []


class EnrollmentsBulkCreate(BaseModel):
    """Create many enrollments with per-row fee structure (e.g. CSV import)."""
    enrollments: list[EnrollmentCreate]


class EnrollmentsBulkResponse(BaseModel):
    enrollments: list[EnrollmentResponse] = []


class TransferStudentsCreate(BaseModel):
    """Transfer (copy) students from one session to another with fee details; payment status is reset."""
    from_session_id: UUID
    to_session_id: UUID
    student_ids: list[UUID]


class TransferStudentsResponse(BaseModel):
    transferred: int
