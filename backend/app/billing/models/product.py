"""Product model."""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import BillingBase


class Product(BillingBase):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    product_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )  # Red Clay Bricks, Fly Ash Bricks, Wire Cut Bricks, Concrete Blocks
    hsn: Mapped[str | None] = mapped_column(Text, default="6904")
    gst_rate: Mapped[Decimal] = mapped_column(Numeric, nullable=False, default=5)
    unit: Mapped[str | None] = mapped_column(Text, default="pieces")
    selling_price: Mapped[Decimal] = mapped_column(Numeric, nullable=False, default=0)
    cost_price: Mapped[Decimal | None] = mapped_column(Numeric, nullable=True)
    current_stock: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
