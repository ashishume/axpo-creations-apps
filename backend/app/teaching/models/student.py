"""Student, StudentEnrollment, and FeePayment models."""
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import TeachingBase


class Student(TeachingBase):
    """Student identity - basic information that persists across sessions."""
    __tablename__ = "school_xx_students"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_schools.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Basic info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    student_id: Mapped[str] = mapped_column(String(50), nullable=False)
    admission_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fee_type: Mapped[str] = mapped_column(String(50), default="Regular")
    
    # Personal details
    father_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mother_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    guardian_phone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    current_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    permanent_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    health_issues: Mapped[str | None] = mapped_column(Text, nullable=True)
    aadhaar_number: Mapped[str | None] = mapped_column(String(12), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    # Profile
    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    sibling_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_students.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Sibling discount - 20% discount applied to only ONE sibling
    has_sibling_discount: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Account freeze - for students who leave mid-session
    is_frozen: Mapped[bool] = mapped_column(Boolean, default=False)
    frozen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    enrollments: Mapped[list["StudentEnrollment"]] = relationship(
        "StudentEnrollment", back_populates="student", lazy="selectin"
    )
    leave_requests: Mapped[list["LeaveRequest"]] = relationship(
        "LeaveRequest", back_populates="student", lazy="selectin"
    )


class StudentEnrollment(TeachingBase):
    """Session-specific enrollment with fee structure and payment tracking."""
    __tablename__ = "school_xx_student_enrollments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_students.id", ondelete="CASCADE"),
        nullable=False,
    )
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
    
    # Fee structure (per enrollment)
    registration_fees: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    annual_fund: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    monthly_fees: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    transport_fees: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Fee payment status flags
    registration_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    annual_fund_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Due date config
    due_day_of_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    late_fee_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    late_fee_frequency: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    # Legacy fields for backward compatibility
    target_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    fine_per_day: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    due_frequency: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships - use joined to eager load
    student: Mapped["Student"] = relationship("Student", back_populates="enrollments", lazy="joined")
    payments: Mapped[list["FeePayment"]] = relationship(
        "FeePayment", back_populates="enrollment", lazy="selectin"
    )


class FeePayment(TeachingBase):
    """Fee payment record linked to enrollment."""
    __tablename__ = "school_xx_fee_payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_student_enrollments.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Keep student_id temporarily for backward compatibility during migration
    student_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    method: Mapped[str] = mapped_column(String(50), nullable=False)
    receipt_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fee_category: Mapped[str] = mapped_column(String(50), nullable=False)
    month: Mapped[str | None] = mapped_column(String(7), nullable=True)
    receipt_photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    enrollment: Mapped["StudentEnrollment"] = relationship("StudentEnrollment", back_populates="payments")
