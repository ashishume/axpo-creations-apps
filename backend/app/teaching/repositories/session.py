"""Session repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.school import Session


class SessionRepository:
    async def get(self, db: AsyncSession, id: UUID) -> Session | None:
        result = await db.execute(select(Session).where(Session.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Session]:
        result = await db.execute(select(Session).order_by(Session.created_at.desc()))
        return list(result.scalars().all())

    async def list_by_school(self, db: AsyncSession, school_id: UUID) -> list[Session]:
        result = await db.execute(
            select(Session).where(Session.school_id == school_id).order_by(Session.created_at.desc())
        )
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, session: Session) -> Session:
        db.add(session)
        await db.flush()
        await db.refresh(session)
        return session

    async def update(self, db: AsyncSession, session: Session) -> Session:
        await db.flush()
        await db.refresh(session)
        return session

    async def delete(self, db: AsyncSession, session: Session) -> None:
        await db.delete(session)
        await db.flush()


session_repository = SessionRepository()
