"""Student repository: DB operations only."""
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.models.student import Student, FeePayment


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

    async def add_payment(
        self,
        db: AsyncSession,
        student_id: UUID,
        *,
        payment_date: date,
        amount: Decimal,
        method: str,
        receipt_number: str | None,
        fee_category: str,
        month: str | None = None,
        receipt_photo_url: str | None = None,
    ) -> FeePayment:
        payment = FeePayment(
            student_id=student_id,
            date=payment_date,
            amount=amount,
            method=method,
            receipt_number=receipt_number or None,
            fee_category=fee_category,
            month=month,
            receipt_photo_url=receipt_photo_url,
        )
        db.add(payment)
        await db.flush()
        await db.refresh(payment)
        return payment

    async def delete_payment(self, db: AsyncSession, payment_id: UUID, student_id: UUID) -> bool:
        result = await db.execute(
            select(FeePayment).where(
                FeePayment.id == payment_id,
                FeePayment.student_id == student_id,
            )
        )
        payment = result.scalar_one_or_none()
        if not payment:
            return False
        await db.delete(payment)
        await db.flush()
        return True


student_repository = StudentRepository()
