"""Session CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.teaching.models.school import Session
from app.teaching.schemas.session import SessionCreate, SessionUpdate


class SessionService:
    async def create(self, db: AsyncSession, data: SessionCreate) -> Session:
        session = Session(**data.model_dump())
        db.add(session)
        await db.flush()
        await db.refresh(session)
        return session

    async def get(self, db: AsyncSession, id: UUID) -> Session | None:
        result = await db.execute(select(Session).where(Session.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Session:
        session = await self.get(db, id)
        if not session:
            raise NotFoundError("Session not found")
        return session

    async def list_by_school(self, db: AsyncSession, school_id: UUID) -> list[Session]:
        result = await db.execute(
            select(Session).where(Session.school_id == school_id).order_by(Session.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_all(self, db: AsyncSession) -> list[Session]:
        result = await db.execute(select(Session).order_by(Session.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: SessionUpdate) -> Session:
        session = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(session, k, v)
        await db.flush()
        await db.refresh(session)
        return session

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        session = await self.get_or_404(db, id)
        await db.delete(session)
        await db.flush()


session_service = SessionService()
