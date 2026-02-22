"""Invoice service: business logic and orchestration; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.billing.models.invoice import Invoice, InvoiceItem
from app.billing.schemas.invoice import InvoiceCreate, InvoiceUpdate
from app.billing.repositories.invoice import invoice_repository


class InvoiceService:
    """Invoice application service."""

    async def create(self, db: AsyncSession, data: InvoiceCreate) -> Invoice:
        payload = data.model_dump(exclude={"items"})
        invoice = Invoice(**payload)
        await invoice_repository.add(db, invoice)
        for item_data in data.items:
            item = InvoiceItem(invoice_id=invoice.id, **item_data.model_dump())
            await invoice_repository.add_item(db, item)
        result = await invoice_repository.get(db, invoice.id)
        assert result is not None
        return result

    async def get(self, db: AsyncSession, id: UUID) -> Invoice | None:
        return await invoice_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Invoice:
        invoice = await invoice_repository.get(db, id)
        if not invoice:
            raise NotFoundError("Invoice not found")
        return invoice

    async def list_all(self, db: AsyncSession) -> list[Invoice]:
        return await invoice_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: InvoiceUpdate) -> Invoice:
        invoice = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(invoice, k, v)
        return await invoice_repository.update(db, invoice)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        invoice = await self.get_or_404(db, id)
        await invoice_repository.delete(db, invoice)


invoice_service = InvoiceService()
