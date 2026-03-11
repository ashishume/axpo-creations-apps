"""Purchase invoice repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.models.purchase_invoice import PurchaseInvoice, PurchaseInvoiceItem


def _purchase_invoice_query():
    return select(PurchaseInvoice).options(selectinload(PurchaseInvoice.items))


class PurchaseInvoiceRepository:
    """Repository for PurchaseInvoice DB operations."""

    async def get(self, db: AsyncSession, id: UUID) -> PurchaseInvoice | None:
        result = await db.execute(_purchase_invoice_query().where(PurchaseInvoice.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[PurchaseInvoice]:
        result = await db.execute(_purchase_invoice_query().order_by(PurchaseInvoice.created_at.desc()))
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, purchase_invoice: PurchaseInvoice) -> PurchaseInvoice:
        db.add(purchase_invoice)
        await db.flush()
        await db.refresh(purchase_invoice)
        return purchase_invoice

    async def add_item(self, db: AsyncSession, item: PurchaseInvoiceItem) -> PurchaseInvoiceItem:
        db.add(item)
        await db.flush()
        await db.refresh(item)
        return item

    async def update(self, db: AsyncSession, purchase_invoice: PurchaseInvoice) -> PurchaseInvoice:
        await db.flush()
        await db.refresh(purchase_invoice)
        return purchase_invoice

    async def delete(self, db: AsyncSession, purchase_invoice: PurchaseInvoice) -> None:
        await db.delete(purchase_invoice)
        await db.flush()


purchase_invoice_repository = PurchaseInvoiceRepository()
