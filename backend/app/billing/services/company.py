"""Company service: business logic and orchestration; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.billing.models.company import Company
from app.billing.schemas.company import CompanyCreate, CompanyUpdate
from app.billing.repositories.company import company_repository


class CompanyService:
    """Company application service."""

    async def create(self, db: AsyncSession, data: CompanyCreate) -> Company:
        company = Company(**data.model_dump())
        return await company_repository.add(db, company)

    async def get(self, db: AsyncSession, id: UUID) -> Company | None:
        return await company_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Company:
        company = await company_repository.get(db, id)
        if not company:
            raise NotFoundError("Company not found")
        return company

    async def list_all(self, db: AsyncSession) -> list[Company]:
        return await company_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: CompanyUpdate) -> Company:
        company = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(company, k, v)
        return await company_repository.update(db, company)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        company = await self.get_or_404(db, id)
        await company_repository.delete(db, company)


company_service = CompanyService()
