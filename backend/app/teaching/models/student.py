"""Student and FeePayment models."""
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import TeachingBase


class Student(TeachingBase):
    __tablename__ = "school_xx_students"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    class_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_classes.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    student_id: Mapped[str] = mapped_column(String(50), nullable=False)
    fee_type: Mapped[str] = mapped_column(String(50), default="Regular")
    father_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mother_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    guardian_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    current_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    permanent_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(5), nullable=True)
    health_issues: Mapped[str | None] = mapped_column(Text, nullable=True)
    registration_fees: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    admission_fees: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    annual_fund: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    monthly_fees: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    transport_fees: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    registration_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    admission_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    annual_fund_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    due_day_of_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    late_fee_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    late_fee_frequency: Mapped[str | None] = mapped_column(String(20), nullable=True)
    target_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    fine_per_day: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    due_frequency: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class FeePayment(TeachingBase):
    __tablename__ = "school_xx_fee_payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_students.id", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    method: Mapped[str] = mapped_column(String(50), nullable=False)
    receipt_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fee_category: Mapped[str] = mapped_column(String(50), nullable=False)
    month: Mapped[str | None] = mapped_column(String(7), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
