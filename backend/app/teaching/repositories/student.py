"""Student repository: DB operations only."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.student import Student


class StudentRepository:
    async def get(self, db: AsyncSession, id: UUID) -> Student | None:
        result = await db.execute(select(Student).where(Student.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, db: AsyncSession) -> list[Student]:
        result = await db.execute(select(Student).order_by(Student.created_at.desc()))
        return list(result.scalars().all())

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Student]:
        result = await db.execute(
            select(Student).where(Student.session_id == session_id).order_by(Student.student_id)
        )
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, student: Student) -> Student:
        db.add(student)
        await db.flush()
        await db.refresh(student)
        return student

    async def update(self, db: AsyncSession, student: Student) -> Student:
        await db.flush()
        await db.refresh(student)
        return student

    async def delete(self, db: AsyncSession, student: Student) -> None:
        await db.delete(student)
        await db.flush()


student_repository = StudentRepository()
