"""Company repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.models.company import Company


class CompanyRepository:
    """Repository for Company DB operations."""

    async def get(self, db: AsyncSession, id: UUID) -> Company | None:
        result = await db.execute(select(Company).where(Company.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Company]:
        result = await db.execute(select(Company).order_by(Company.created_at.desc()))
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, company: Company) -> Company:
        db.add(company)
        await db.flush()
        await db.refresh(company)
        return company

    async def update(self, db: AsyncSession, company: Company) -> Company:
        await db.flush()
        await db.refresh(company)
        return company

    async def delete(self, db: AsyncSession, company: Company) -> None:
        await db.delete(company)
        await db.flush()


company_repository = CompanyRepository()
