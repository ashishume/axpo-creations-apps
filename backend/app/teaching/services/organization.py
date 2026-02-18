"""Organization CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.teaching.models.organization import Organization
from app.teaching.schemas.organization import OrganizationCreate, OrganizationUpdate


class OrganizationService:
    async def create(self, db: AsyncSession, data: OrganizationCreate) -> Organization:
        org = Organization(**data.model_dump())
        db.add(org)
        await db.flush()
        await db.refresh(org)
        return org

    async def get(self, db: AsyncSession, id: UUID) -> Organization | None:
        result = await db.execute(select(Organization).where(Organization.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Organization:
        org = await self.get(db, id)
        if not org:
            raise NotFoundError("Organization not found")
        return org

    async def list_all(self, db: AsyncSession) -> list[Organization]:
        result = await db.execute(select(Organization).order_by(Organization.name))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: OrganizationUpdate) -> Organization:
        org = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(org, k, v)
        await db.flush()
        await db.refresh(org)
        return org

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        org = await self.get_or_404(db, id)
        await db.delete(org)
        await db.flush()


organization_service = OrganizationService()
