"""Leave types, balances, and requests schemas."""
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


# ----- Leave Type -----


class LeaveTypeBase(BaseModel):
    session_id: UUID
    name: str
    code: str
    applicable_to: str  # staff, student, both
    max_days_per_year: int | None = None
    requires_document: bool = False
    is_active: bool = True


class LeaveTypeCreate(LeaveTypeBase):
    pass


class LeaveTypeUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    applicable_to: str | None = None
    max_days_per_year: int | None = None
    requires_document: bool | None = None
    is_active: bool | None = None


class LeaveTypeResponse(LeaveTypeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ----- Leave Balance -----


class LeaveBalanceBase(BaseModel):
    staff_id: UUID
    leave_type_id: UUID
    year: str
    total_days: int = 0
    used_days: int = 0


class LeaveBalanceCreate(LeaveBalanceBase):
    pass


class LeaveBalanceUpdate(BaseModel):
    total_days: int | None = None
    used_days: int | None = None


class LeaveBalanceResponse(LeaveBalanceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    leave_type: LeaveTypeResponse | None = None

    model_config = {"from_attributes": True}


# ----- Leave Request -----


class LeaveRequestBase(BaseModel):
    session_id: UUID
    leave_type_id: UUID | None = None
    applicant_type: str  # staff, student
    staff_id: UUID | None = None
    student_id: UUID | None = None
    from_date: date
    to_date: date
    days_count: int
    reason: str
    document_url: str | None = None


class LeaveRequestCreate(LeaveRequestBase):
    pass


class LeaveRequestUpdate(BaseModel):
    from_date: date | None = None
    to_date: date | None = None
    days_count: int | None = None
    reason: str | None = None
    document_url: str | None = None


class LeaveRequestReview(BaseModel):
    remarks: str | None = None


class LeaveRequestResponse(LeaveRequestBase):
    id: UUID
    status: str = "pending"
    applied_at: datetime
    reviewed_by: UUID | None = None
    reviewed_at: datetime | None = None
    reviewer_remarks: str | None = None
    created_at: datetime
    updated_at: datetime
    leave_type: LeaveTypeResponse | None = None

    model_config = {"from_attributes": True}
