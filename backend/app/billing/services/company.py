"""Company CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.billing.models.company import Company
from app.billing.schemas.company import CompanyCreate, CompanyUpdate


class CompanyService:
    async def create(self, db: AsyncSession, data: CompanyCreate) -> Company:
        company = Company(**data.model_dump())
        db.add(company)
        await db.flush()
        await db.refresh(company)
        return company

    async def get(self, db: AsyncSession, id: UUID) -> Company | None:
        result = await db.execute(select(Company).where(Company.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Company:
        company = await self.get(db, id)
        if not company:
            raise NotFoundError("Company not found")
        return company

    async def list_all(self, db: AsyncSession) -> list[Company]:
        result = await db.execute(select(Company).order_by(Company.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: CompanyUpdate) -> Company:
        company = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(company, k, v)
        await db.flush()
        await db.refresh(company)
        return company

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        company = await self.get_or_404(db, id)
        await db.delete(company)
        await db.flush()


company_service = CompanyService()
