"""Role service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ForbiddenError, ValidationError
from app.teaching.models.role import Role, RolePermission
from app.teaching.schemas.role import RoleCreate, RoleUpdate
from app.teaching.repositories.role import role_repository

SUPER_ADMIN_ROLE_NAME = "Super Admin"


class RoleService:
    async def list_all(self, db: AsyncSession) -> list[tuple[Role, list[str]]]:
        roles = await role_repository.list_all(db)
        out = []
        for role in roles:
            perms = await role_repository.get_permission_ids(db, role.id)
            out.append((role, perms))
        return out

    async def get(self, db: AsyncSession, id: UUID) -> tuple[Role, list[str]] | None:
        role = await role_repository.get(db, id)
        if not role:
            return None
        perms = await role_repository.get_permission_ids(db, role.id)
        return (role, perms)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> tuple[Role, list[str]]:
        row = await self.get(db, id)
        if not row:
            raise NotFoundError("Role not found")
        return row

    async def create(self, db: AsyncSession, data: RoleCreate) -> tuple[Role, list[str]]:
        if data.name.strip().lower() == SUPER_ADMIN_ROLE_NAME.lower():
            raise ValidationError("Cannot create a role named Super Admin")
        role = Role(
            name=data.name,
            description=data.description,
            is_system=False,
        )
        await role_repository.add(db, role)
        for perm_id in data.permissions:
            await role_repository.add_permission(db, RolePermission(role_id=role.id, permission_id=perm_id))
        perms = await role_repository.get_permission_ids(db, role.id)
        return (role, perms)

    async def update(
        self, db: AsyncSession, id: UUID, data: RoleUpdate
    ) -> tuple[Role, list[str]]:
        role, perms = await self.get_or_404(db, id)
        if role.is_system:
            raise ForbiddenError("Cannot modify system roles")
        if data.name is not None and data.name.strip().lower() == SUPER_ADMIN_ROLE_NAME.lower():
            raise ValidationError("Cannot rename a role to Super Admin")
        if data.name is not None:
            role.name = data.name
        if data.description is not None:
            role.description = data.description
        if data.permissions is not None:
            await role_repository.replace_permissions(db, id, data.permissions)
        await role_repository.update(db, role)
        perms = await role_repository.get_permission_ids(db, role.id)
        return (role, perms)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        role, _ = await self.get_or_404(db, id)
        if role.is_system:
            raise ForbiddenError("Cannot delete system roles")
        await role_repository.delete(db, role)


role_service = RoleService()
