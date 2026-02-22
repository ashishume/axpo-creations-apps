"""Student service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.student import Student
from app.teaching.schemas.student import StudentCreate, StudentUpdate
from app.teaching.repositories.student import student_repository


class StudentService:
    async def create(self, db: AsyncSession, data: StudentCreate) -> Student:
        student = Student(**data.model_dump())
        return await student_repository.add(db, student)

    async def create_many(self, db: AsyncSession, items: list[StudentCreate]) -> list[Student]:
        out = []
        for d in items:
            student = Student(**d.model_dump())
            out.append(await student_repository.add(db, student))
        return out

    async def get(self, db: AsyncSession, id: UUID) -> Student | None:
        return await student_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Student:
        student = await student_repository.get(db, id)
        if not student:
            raise NotFoundError("Student not found")
        return student

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[Student]:
        return await student_repository.list_by_session(db, session_id)

    async def list_all(self, db: AsyncSession) -> list[Student]:
        return await student_repository.list_all(db)

    async def update(self, db: AsyncSession, id: UUID, data: StudentUpdate) -> Student:
        student = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(student, k, v)
        return await student_repository.update(db, student)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        student = await self.get_or_404(db, id)
        await student_repository.delete(db, student)


student_service = StudentService()
