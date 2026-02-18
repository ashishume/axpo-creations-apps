"""Invoice CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.billing.models.invoice import Invoice, InvoiceItem
from app.billing.schemas.invoice import InvoiceCreate, InvoiceUpdate


def _invoice_query():
    return select(Invoice).options(selectinload(Invoice.items))


class InvoiceService:
    async def create(self, db: AsyncSession, data: InvoiceCreate) -> Invoice:
        items_data = data.items
        payload = data.model_dump(exclude={"items"})
        invoice = Invoice(**payload)
        db.add(invoice)
        await db.flush()
        for item in items_data:
            inv_item = InvoiceItem(invoice_id=invoice.id, **item.model_dump())
            db.add(inv_item)
        await db.flush()
        result = await db.execute(_invoice_query().where(Invoice.id == invoice.id))
        return result.scalar_one()

    async def get(self, db: AsyncSession, id: UUID) -> Invoice | None:
        result = await db.execute(_invoice_query().where(Invoice.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Invoice:
        invoice = await self.get(db, id)
        if not invoice:
            raise NotFoundError("Invoice not found")
        return invoice

    async def list_all(self, db: AsyncSession) -> list[Invoice]:
        result = await db.execute(_invoice_query().order_by(Invoice.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: InvoiceUpdate) -> Invoice:
        invoice = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(invoice, k, v)
        await db.flush()
        await db.refresh(invoice)
        return invoice

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        invoice = await self.get_or_404(db, id)
        await db.delete(invoice)
        await db.flush()


invoice_service = InvoiceService()
