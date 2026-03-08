"""Student service: business logic; uses repository for DB."""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.student import Student, FeePayment
from app.teaching.schemas.student import StudentCreate, StudentUpdate, FeePaymentCreate
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

    async def add_payment(
        self, db: AsyncSession, student_id: UUID, data: FeePaymentCreate
    ) -> FeePayment:
        await self.get_or_404(db, student_id)
        return await student_repository.add_payment(
            db,
            student_id,
            payment_date=data.date,
            amount=data.amount,
            method=data.method,
            receipt_number=data.receipt_number,
            fee_category=data.fee_category,
            month=data.month,
            receipt_photo_url=data.receipt_photo_url,
        )

    async def delete_payment(
        self, db: AsyncSession, student_id: UUID, payment_id: UUID
    ) -> bool:
        await self.get_or_404(db, student_id)
        return await student_repository.delete_payment(db, payment_id, student_id)


student_service = StudentService()
