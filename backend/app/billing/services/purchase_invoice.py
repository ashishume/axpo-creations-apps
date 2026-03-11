"""Purchase invoice service: create invoice + items and auto stock-in."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.billing.models.purchase_invoice import PurchaseInvoice, PurchaseInvoiceItem
from app.billing.models.stock import StockMovement
from app.billing.schemas.purchase_invoice import PurchaseInvoiceCreate, PurchaseInvoiceUpdate
from app.billing.repositories.purchase_invoice import purchase_invoice_repository
from app.billing.repositories.stock import stock_repository
from app.billing.repositories.product import product_repository


class PurchaseInvoiceService:
    """Purchase invoice application service. On create, adds stock movements (type=purchase) and updates product stock."""

    async def create(self, db: AsyncSession, data: PurchaseInvoiceCreate) -> PurchaseInvoice:
        payload = data.model_dump(exclude={"items"})
        purchase_invoice = PurchaseInvoice(**payload)
        await purchase_invoice_repository.add(db, purchase_invoice)
        for item_data in data.items:
            item = PurchaseInvoiceItem(
                purchase_invoice_id=purchase_invoice.id,
                **item_data.model_dump(),
            )
            await purchase_invoice_repository.add_item(db, item)
            if item.product_id and item.quantity > 0:
                movement = StockMovement(
                    date=purchase_invoice.date,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    type="purchase",
                    reference_id=purchase_invoice.id,
                    remarks=f"Purchase invoice {purchase_invoice.number}",
                )
                await stock_repository.add(db, movement)
                await product_repository.increment_stock(db, item.product_id, item.quantity)
        result = await purchase_invoice_repository.get(db, purchase_invoice.id)
        assert result is not None
        return result

    async def get(self, db: AsyncSession, id: UUID) -> PurchaseInvoice | None:
        return await purchase_invoice_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> PurchaseInvoice:
        purchase_invoice = await purchase_invoice_repository.get(db, id)
        if not purchase_invoice:
            raise NotFoundError("Purchase invoice not found")
        return purchase_invoice

    async def list_all(self, db: AsyncSession) -> list[PurchaseInvoice]:
        return await purchase_invoice_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: PurchaseInvoiceUpdate) -> PurchaseInvoice:
        purchase_invoice = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(purchase_invoice, k, v)
        return await purchase_invoice_repository.update(db, purchase_invoice)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        purchase_invoice = await self.get_or_404(db, id)
        await purchase_invoice_repository.delete(db, purchase_invoice)


purchase_invoice_service = PurchaseInvoiceService()
