"""Invoice repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.models.invoice import Invoice, InvoiceItem


def _invoice_query():
    return select(Invoice).options(selectinload(Invoice.items))


class InvoiceRepository:
    """Repository for Invoice DB operations."""

    async def get(self, db: AsyncSession, id: UUID) -> Invoice | None:
        result = await db.execute(_invoice_query().where(Invoice.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Invoice]:
        result = await db.execute(_invoice_query().order_by(Invoice.created_at.desc()))
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, invoice: Invoice) -> Invoice:
        db.add(invoice)
        await db.flush()
        await db.refresh(invoice)
        return invoice

    async def add_item(self, db: AsyncSession, item: InvoiceItem) -> InvoiceItem:
        db.add(item)
        await db.flush()
        await db.refresh(item)
        return item

    async def update(self, db: AsyncSession, invoice: Invoice) -> Invoice:
        await db.flush()
        await db.refresh(invoice)
        return invoice

    async def delete(self, db: AsyncSession, invoice: Invoice) -> None:
        await db.delete(invoice)
        await db.flush()


invoice_repository = InvoiceRepository()
