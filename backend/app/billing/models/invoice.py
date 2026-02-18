"""Invoice and InvoiceItem models."""
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import BillingBase


class Invoice(BillingBase):
    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    number: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id"),
        nullable=True,
    )
    subtotal: Mapped[Decimal] = mapped_column(Numeric, nullable=False, default=0)
    discount: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    taxable_amount: Mapped[Decimal] = mapped_column(Numeric, nullable=False, default=0)
    cgst_amount: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    sgst_amount: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    igst_amount: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    round_off: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    total: Mapped[Decimal] = mapped_column(Numeric, nullable=False, default=0)
    total_in_words: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="draft",
    )  # draft, final, cancelled
    cancel_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    items: Mapped[list["InvoiceItem"]] = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(BillingBase):
    __tablename__ = "invoice_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rate: Mapped[Decimal] = mapped_column(Numeric, nullable=False, default=0)
    cost_price: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    discount: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    line_total: Mapped[Decimal] = mapped_column(Numeric, nullable=False, default=0)
    taxable_amount: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    gst_amount: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")
