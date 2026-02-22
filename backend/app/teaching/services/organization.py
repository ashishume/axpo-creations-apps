"""Organization service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.organization import Organization
from app.teaching.schemas.organization import OrganizationCreate, OrganizationUpdate
from app.teaching.repositories.organization import organization_repository


class OrganizationService:
    async def create(self, db: AsyncSession, data: OrganizationCreate) -> Organization:
        org = Organization(**data.model_dump())
        return await organization_repository.add(db, org)

    async def get(self, db: AsyncSession, id: UUID) -> Organization | None:
        return await organization_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Organization:
        org = await organization_repository.get(db, id)
        if not org:
            raise NotFoundError("Organization not found")
        return org

    async def list_all(self, db: AsyncSession) -> list[Organization]:
        return await organization_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: OrganizationUpdate) -> Organization:
        org = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(org, k, v)
        return await organization_repository.update(db, org)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        org = await self.get_or_404(db, id)
        await organization_repository.delete(db, org)


organization_service = OrganizationService()
