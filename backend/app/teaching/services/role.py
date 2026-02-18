"""Role CRUD service."""
from uuid import UUID

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.teaching.models.role import Role, RolePermission
from app.teaching.schemas.role import RoleCreate, RoleUpdate

SUPER_ADMIN_ROLE_NAME = "Super Admin"


class RoleService:
    async def list_all(self, db: AsyncSession) -> list[tuple[Role, list[str]]]:
        result = await db.execute(select(Role).order_by(Role.name))
        roles = list(result.scalars().all())
        out = []
        for role in roles:
            perms = await self._get_permissions_for_role(db, role.id)
            out.append((role, perms))
        return out

    async def _get_permissions_for_role(self, db: AsyncSession, role_id: UUID) -> list[str]:
        result = await db.execute(
            select(RolePermission.permission_id).where(RolePermission.role_id == role_id)
        )
        return [r for r in result.scalars().all()]

    async def get(self, db: AsyncSession, id: UUID) -> tuple[Role, list[str]] | None:
        result = await db.execute(select(Role).where(Role.id == id))
        role = result.scalar_one_or_none()
        if not role:
            return None
        perms = await self._get_permissions_for_role(db, role.id)
        return (role, perms)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> tuple[Role, list[str]]:
        row = await self.get(db, id)
        if not row:
            raise NotFoundError("Role not found")
        return row

    async def create(self, db: AsyncSession, data: RoleCreate) -> tuple[Role, list[str]]:
        if data.name.strip().lower() == SUPER_ADMIN_ROLE_NAME.lower():
            raise ValueError("Cannot create a role named Super Admin")
        role = Role(
            name=data.name,
            description=data.description,
            is_system=False,
        )
        db.add(role)
        await db.flush()
        for perm_id in data.permissions:
            rp = RolePermission(role_id=role.id, permission_id=perm_id)
            db.add(rp)
        await db.flush()
        await db.refresh(role)
        perms = await self._get_permissions_for_role(db, role.id)
        return (role, perms)

    async def update(
        self, db: AsyncSession, id: UUID, data: RoleUpdate
    ) -> tuple[Role, list[str]]:
        role, perms = await self.get_or_404(db, id)
        if role.is_system:
            raise ValueError("Cannot modify system roles")
        if data.name is not None and data.name.strip().lower() == SUPER_ADMIN_ROLE_NAME.lower():
            raise ValueError("Cannot rename a role to Super Admin")
        if data.name is not None:
            role.name = data.name
        if data.description is not None:
            role.description = data.description
        if data.permissions is not None:
            await db.execute(delete(RolePermission).where(RolePermission.role_id == id))
            for perm_id in data.permissions:
                db.add(RolePermission(role_id=id, permission_id=perm_id))
        await db.flush()
        await db.refresh(role)
        perms = await self._get_permissions_for_role(db, role.id)
        return (role, perms)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        role, _ = await self.get_or_404(db, id)
        if role.is_system:
            raise ValueError("Cannot delete system roles")
        await db.delete(role)
        await db.flush()


role_service = RoleService()
