"""Student CRUD service."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError

from app.teaching.models.student import Student
from app.teaching.schemas.student import StudentCreate, StudentUpdate


class StudentService:
    async def create(self, db: AsyncSession, data: StudentCreate) -> Student:
        student = Student(**data.model_dump())
        db.add(student)
        await db.flush()
        await db.refresh(student)
        return student

    async def create_many(self, db: AsyncSession, items: list[StudentCreate]) -> list[Student]:
        students = [Student(**d.model_dump()) for d in items]
        for s in students:
            db.add(s)
        await db.flush()
        for s in students:
            await db.refresh(s)
        return students

    async def get(self, db: AsyncSession, id: UUID) -> Student | None:
        result = await db.execute(select(Student).where(Student.id == id))
        return result.scalar_one_or_none()

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Student:
        student = await self.get(db, id)
        if not student:
            raise NotFoundError("Student not found")
        return student

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Student]:
        result = await db.execute(
            select(Student).where(Student.session_id == session_id).order_by(Student.student_id)
        )
        return list(result.scalars().all())

    async def list_all(self, db: AsyncSession) -> list[Student]:
        result = await db.execute(select(Student).order_by(Student.created_at.desc()))
        return list(result.scalars().all())

    async def update(self, db: AsyncSession, id: UUID, data: StudentUpdate) -> Student:
        student = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(student, k, v)
        await db.flush()
        await db.refresh(student)
        return student

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        student = await self.get_or_404(db, id)
        await db.delete(student)
        await db.flush()


student_service = StudentService()
