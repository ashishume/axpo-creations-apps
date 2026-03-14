"""Student and Enrollment repositories: DB operations only."""
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.teaching.models.student import Student, StudentEnrollment, FeePayment
from app.teaching.models.school import School, Session


def _search_words(search: str) -> list[str]:
    """Split search into non-empty words for basic fuzzy matching."""
    if not search or not search.strip():
        return []
    return [w.strip() for w in search.strip().split() if w.strip()]


def _escape_like(value: str) -> str:
    """Escape % and _ for use in SQL LIKE/ILIKE patterns."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class StudentRepository:
    """Repository for Student (identity) operations."""
    
    async def get(self, db: AsyncSession, id: UUID) -> Student | None:
        result = await db.execute(select(Student).where(Student.id == id))
        return result.scalar_one_or_none()

    async def list_by_school(self, db: AsyncSession, school_id: UUID) -> list[Student]:
        result = await db.execute(
            select(Student).where(Student.school_id == school_id).order_by(Student.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[Student]:
        result = await db.execute(
            select(Student)
            .join(School, Student.school_id == School.id)
            .where(School.organization_id == organization_id)
            .order_by(Student.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_by_organization(self, db: AsyncSession, organization_id: UUID) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(Student)
            .join(School, Student.school_id == School.id)
            .where(School.organization_id == organization_id)
        )
        return result.scalar() or 0

    async def list_by_organization_paginated(
        self,
        db: AsyncSession,
        organization_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> list[Student]:
        result = await db.execute(
            select(Student)
            .join(School, Student.school_id == School.id)
            .where(School.organization_id == organization_id)
            .order_by(Student.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def count_by_school(self, db: AsyncSession, school_id: UUID) -> int:
        result = await db.execute(
            select(func.count()).select_from(Student).where(Student.school_id == school_id)
        )
        return result.scalar() or 0

    async def add(self, db: AsyncSession, student: Student) -> Student:
        db.add(student)
        await db.flush()
        await db.refresh(student)
        return student

    async def add_bulk(
        self, db: AsyncSession, students: list[Student]
    ) -> list[Student]:
        """Add multiple students in a single transaction."""
        db.add_all(students)
        await db.flush()
        for student in students:
            await db.refresh(student)
        return students

    async def update(self, db: AsyncSession, student: Student) -> Student:
        await db.flush()
        await db.refresh(student)
        return student

    async def delete(self, db: AsyncSession, student: Student) -> None:
        await db.delete(student)
        await db.flush()


class EnrollmentRepository:
    """Repository for StudentEnrollment (session-specific) operations."""
    
    async def get(self, db: AsyncSession, id: UUID) -> StudentEnrollment | None:
        result = await db.execute(select(StudentEnrollment).where(StudentEnrollment.id == id))
        return result.scalar_one_or_none()

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[StudentEnrollment]:
        result = await db.execute(
            select(StudentEnrollment)
            .where(StudentEnrollment.session_id == session_id)
            .order_by(StudentEnrollment.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_student(self, db: AsyncSession, student_id: UUID) -> list[StudentEnrollment]:
        result = await db.execute(
            select(StudentEnrollment)
            .where(StudentEnrollment.student_id == student_id)
            .order_by(StudentEnrollment.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_student_and_session(
        self, db: AsyncSession, student_id: UUID, session_id: UUID
    ) -> StudentEnrollment | None:
        result = await db.execute(
            select(StudentEnrollment).where(
                StudentEnrollment.student_id == student_id,
                StudentEnrollment.session_id == session_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[StudentEnrollment]:
        result = await db.execute(
            select(StudentEnrollment)
            .join(Session, StudentEnrollment.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
            .order_by(StudentEnrollment.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_by_session(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        search: str | None = None,
    ) -> int:
        if search and _search_words(search):
            q = (
                select(func.count())
                .select_from(StudentEnrollment)
                .join(Student, StudentEnrollment.student_id == Student.id)
                .where(StudentEnrollment.session_id == session_id)
            )
            words = _search_words(search)
            conditions = [
                or_(
                    Student.name.ilike(f"%{_escape_like(w)}%"),
                    Student.student_id.ilike(f"%{_escape_like(w)}%"),
                )
                for w in words
            ]
            q = q.where(and_(*conditions))
            result = await db.execute(q)
            return result.scalar() or 0
        result = await db.execute(
            select(func.count())
            .select_from(StudentEnrollment)
            .where(StudentEnrollment.session_id == session_id)
        )
        return result.scalar() or 0

    async def list_by_session_paginated(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
    ) -> list[StudentEnrollment]:
        words = _search_words(search) if search else []
        if words:
            q = (
                select(StudentEnrollment)
                .join(Student, StudentEnrollment.student_id == Student.id)
                .where(StudentEnrollment.session_id == session_id)
            )
            conditions = [
                or_(
                    Student.name.ilike(f"%{_escape_like(w)}%"),
                    Student.student_id.ilike(f"%{_escape_like(w)}%"),
                )
                for w in words
            ]
            q = q.where(and_(*conditions))
        else:
            q = select(StudentEnrollment).where(StudentEnrollment.session_id == session_id)
        q = q.order_by(StudentEnrollment.created_at.desc()).limit(limit).offset(offset).options(
            selectinload(StudentEnrollment.student),
            selectinload(StudentEnrollment.payments),
        )
        result = await db.execute(q)
        return list(result.scalars().all())

    async def count_by_organization(self, db: AsyncSession, organization_id: UUID) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(StudentEnrollment)
            .join(Session, StudentEnrollment.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
        )
        return result.scalar() or 0

    async def list_by_organization_paginated(
        self,
        db: AsyncSession,
        organization_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> list[StudentEnrollment]:
        result = await db.execute(
            select(StudentEnrollment)
            .join(Session, StudentEnrollment.session_id == Session.id)
            .join(School, Session.school_id == School.id)
            .where(School.organization_id == organization_id)
            .order_by(StudentEnrollment.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def add(self, db: AsyncSession, enrollment: StudentEnrollment) -> StudentEnrollment:
        db.add(enrollment)
        await db.flush()
        await db.refresh(enrollment)
        return enrollment

    async def add_bulk(
        self, db: AsyncSession, enrollments: list[StudentEnrollment]
    ) -> list[StudentEnrollment]:
        """Add multiple enrollments in a single transaction."""
        db.add_all(enrollments)
        await db.flush()
        for enrollment in enrollments:
            await db.refresh(enrollment)
        return enrollments

    async def update(self, db: AsyncSession, enrollment: StudentEnrollment) -> StudentEnrollment:
        await db.flush()
        await db.refresh(enrollment)
        return enrollment

    async def delete(self, db: AsyncSession, enrollment: StudentEnrollment) -> None:
        await db.delete(enrollment)
        await db.flush()

    async def add_payment(
        self,
        db: AsyncSession,
        enrollment_id: UUID,
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
            enrollment_id=enrollment_id,
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

    async def delete_payment(self, db: AsyncSession, payment_id: UUID, enrollment_id: UUID) -> bool:
        result = await db.execute(
            select(FeePayment).where(
                FeePayment.id == payment_id,
                FeePayment.enrollment_id == enrollment_id,
            )
        )
        payment = result.scalar_one_or_none()
        if not payment:
            return False
        await db.delete(payment)
        await db.flush()
        return True


student_repository = StudentRepository()
enrollment_repository = EnrollmentRepository()
