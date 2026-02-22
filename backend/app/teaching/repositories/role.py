"""Role repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.role import Role, RolePermission


class RoleRepository:
    async def get(self, db: AsyncSession, id: UUID) -> Role | None:
        result = await db.execute(select(Role).where(Role.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Role]:
        result = await db.execute(select(Role).order_by(Role.name))
        return list(result.scalars().all())

    async def get_permission_ids(self, db: AsyncSession, role_id: UUID) -> list[str]:
        result = await db.execute(
            select(RolePermission.permission_id).where(RolePermission.role_id == role_id)
        )
        return [row[0] for row in result.all()]

    async def add(self, db: AsyncSession, role: Role) -> Role:
        db.add(role)
        await db.flush()
        await db.refresh(role)
        return role

    async def add_permission(self, db: AsyncSession, rp: RolePermission) -> RolePermission:
        db.add(rp)
        await db.flush()
        await db.refresh(rp)
        return rp

    async def replace_permissions(self, db: AsyncSession, role_id: UUID, permission_ids: list[str]) -> None:
        await db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        for perm_id in permission_ids:
            db.add(RolePermission(role_id=role_id, permission_id=perm_id))
        await db.flush()

    async def update(self, db: AsyncSession, role: Role) -> Role:
        await db.flush()
        await db.refresh(role)
        return role

    async def delete(self, db: AsyncSession, role: Role) -> None:
        await db.delete(role)
        await db.flush()


role_repository = RoleRepository()
