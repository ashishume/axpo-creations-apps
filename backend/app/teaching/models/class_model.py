"""Class model (academic class)."""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import TeachingBase


class Class(TeachingBase):
    __tablename__ = "school_xx_classes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("school_xx_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    registration_fees: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    admission_fees: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    annual_fund: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    monthly_fees: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    late_fee_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    late_fee_frequency: Mapped[str] = mapped_column(String(20), default="weekly")
    due_day_of_month: Mapped[int] = mapped_column(Integer, default=10)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
