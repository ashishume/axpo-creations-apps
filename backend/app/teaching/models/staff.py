"""Staff and SalaryPayment models."""
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import TeachingBase


class Staff(TeachingBase):
    __tablename__ = "school_xx_staff"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    employee_id: Mapped[str] = mapped_column(String(50), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    monthly_salary: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    subject_or_grade: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    salary_due_day: Mapped[int] = mapped_column(Integer, default=5)

    # Leave & Salary Deduction Configuration (per teacher)
    allowed_leaves_per_month: Mapped[int] = mapped_column(Integer, default=2)
    per_day_salary: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    # Classes & Subjects (dynamic array) - [{className: string, subjects: string[]}]
    classes_subjects: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    salary_payments: Mapped[list["SalaryPayment"]] = relationship(
        "SalaryPayment", back_populates="staff", lazy="selectin"
    )
    leave_balances: Mapped[list["LeaveBalance"]] = relationship(
        "LeaveBalance", back_populates="staff", lazy="selectin"
    )
    leave_requests: Mapped[list["LeaveRequest"]] = relationship(
        "LeaveRequest", back_populates="staff", lazy="selectin"
    )


class SalaryPayment(TeachingBase):
    __tablename__ = "school_xx_salary_payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_staff.id", ondelete="CASCADE"),
        nullable=False,
    )
    month: Mapped[str] = mapped_column(String(7), nullable=False)
    expected_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Pending")
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    late_days: Mapped[int] = mapped_column(Integer, default=0)
    method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Leave tracking fields
    days_worked: Mapped[int] = mapped_column(Integer, default=30)
    leaves_taken: Mapped[int] = mapped_column(Integer, default=0)
    allowed_leaves: Mapped[int] = mapped_column(Integer, default=2)
    excess_leaves: Mapped[int] = mapped_column(Integer, default=0)
    leave_deduction: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)

    # Extra allowance/deduction fields
    extra_allowance: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    allowance_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_deduction: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    deduction_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Final calculated salary
    calculated_salary: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    staff: Mapped["Staff"] = relationship("Staff", back_populates="salary_payments")
