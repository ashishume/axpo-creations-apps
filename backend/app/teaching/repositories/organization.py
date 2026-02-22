"""Organization repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.organization import Organization


class OrganizationRepository:
    async def get(self, db: AsyncSession, id: UUID) -> Organization | None:
        result = await db.execute(select(Organization).where(Organization.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Organization]:
        result = await db.execute(select(Organization).order_by(Organization.name))
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, org: Organization) -> Organization:
        db.add(org)
        await db.flush()
        await db.refresh(org)
        return org

    async def update(self, db: AsyncSession, org: Organization) -> Organization:
        await db.flush()
        await db.refresh(org)
        return org

    async def delete(self, db: AsyncSession, org: Organization) -> None:
        await db.delete(org)
        await db.flush()


organization_repository = OrganizationRepository()
