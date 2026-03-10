"""Staff schemas."""
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ClassSubject(BaseModel):
    """Class and subjects mapping for a teacher."""
    class_name: str
    subjects: list[str]


class SalaryPaymentCreate(BaseModel):
    month: str
    amount: Decimal
    status: str = "Paid"
    payment_date: date | None = None
    method: str | None = None
    due_date: str | None = None
    # Leave tracking fields
    days_worked: int = 30
    leaves_taken: int = 0
    # Extra allowance/deduction
    extra_allowance: Decimal = Decimal("0")
    allowance_note: str | None = None
    extra_deduction: Decimal = Decimal("0")
    deduction_note: str | None = None


class SalaryPaymentResponse(BaseModel):
    id: UUID
    month: str
    paid_amount: Decimal
    status: str
    payment_date: date | None = None
    method: str | None = None
    due_date: date | None = None
    late_days: int = 0
    expected_amount: Decimal | None = None
    # Leave tracking fields
    days_worked: int = 30
    leaves_taken: int = 0
    allowed_leaves: int = 2
    excess_leaves: int = 0
    leave_deduction: Decimal = Decimal("0")
    # Extra allowance/deduction
    extra_allowance: Decimal = Decimal("0")
    allowance_note: str | None = None
    extra_deduction: Decimal = Decimal("0")
    deduction_note: str | None = None
    # Calculated salary
    calculated_salary: Decimal = Decimal("0")

    model_config = {"from_attributes": True}


class SalaryPaymentUpdate(BaseModel):
    paid_amount: Decimal | None = None
    status: str | None = None
    payment_date: date | None = None
    method: str | None = None
    # Leave tracking fields
    days_worked: int | None = None
    leaves_taken: int | None = None
    # Extra allowance/deduction
    extra_allowance: Decimal | None = None
    allowance_note: str | None = None
    extra_deduction: Decimal | None = None
    deduction_note: str | None = None


class BulkSalaryPaymentItem(BaseModel):
    staff_id: UUID
    month: str
    amount: Decimal
    status: str = "Paid"
    payment_date: date | None = None
    method: str | None = None
    due_date: str | None = None
    # Leave tracking fields
    days_worked: int = 30
    leaves_taken: int = 0
    # Extra allowance/deduction
    extra_allowance: Decimal = Decimal("0")
    allowance_note: str | None = None
    extra_deduction: Decimal = Decimal("0")
    deduction_note: str | None = None


class LeaveSummaryResponse(BaseModel):
    """Summary of leaves for a staff member for a specific month."""
    staff_id: UUID
    month: str
    leaves_taken: int
    days_in_month: int
    days_worked: int
    allowed_leaves: int
    excess_leaves: int
    per_day_salary: Decimal
    leave_deduction: Decimal


class StaffBase(BaseModel):
    session_id: UUID
    name: str
    employee_id: str
    role: str
    monthly_salary: Decimal
    subject_or_grade: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    salary_due_day: int = 5
    # Leave & salary deduction configuration
    allowed_leaves_per_month: int = 2
    per_day_salary: Decimal | None = None
    # Classes & subjects (dynamic array)
    classes_subjects: list[dict[str, Any]] | None = None


class StaffCreate(StaffBase):
    pass


class StaffUpdate(BaseModel):
    name: str | None = None
    employee_id: str | None = None
    role: str | None = None
    monthly_salary: Decimal | None = None
    subject_or_grade: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    salary_due_day: int | None = None
    # Leave & salary deduction configuration
    allowed_leaves_per_month: int | None = None
    per_day_salary: Decimal | None = None
    # Classes & subjects (dynamic array)
    classes_subjects: list[dict[str, Any]] | None = None


class StaffResponse(StaffBase):
    id: UUID
    user_id: UUID | None
    created_at: datetime
    updated_at: datetime
    salary_payments: list[SalaryPaymentResponse] = []

    model_config = {"from_attributes": True}
