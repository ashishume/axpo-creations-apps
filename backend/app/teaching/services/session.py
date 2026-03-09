"""Session service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.school import Session
from app.teaching.schemas.session import SessionCreate, SessionUpdate
from app.teaching.repositories.session import session_repository


class SessionService:
    async def create(self, db: AsyncSession, data: SessionCreate) -> Session:
        session = Session(**data.model_dump())
        return await session_repository.add(db, session)

    async def get(self, db: AsyncSession, id: UUID) -> Session | None:
        return await session_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Session:
        session = await session_repository.get(db, id)
        if not session:
            raise NotFoundError("Session not found")
        return session

    async def list_by_school(self, db: AsyncSession, school_id: UUID) -> list[Session]:
        return await session_repository.list_by_school(db, school_id)

    async def list_all(self, db: AsyncSession) -> list[Session]:
        return await session_repository.list_all(db)

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[Session]:
        return await session_repository.list_by_organization(db, organization_id)

    async def update(self, db: AsyncSession, id: UUID, data: SessionUpdate) -> Session:
        session = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(session, k, v)
        return await session_repository.update(db, session)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        session = await self.get_or_404(db, id)
        await session_repository.delete(db, session)


session_service = SessionService()
