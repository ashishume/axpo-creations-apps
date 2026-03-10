"""Student and Enrollment services: business logic; uses repositories for DB."""
from uuid import UUID

from sqlalchemy import delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.teaching.models.leave import LeaveRequest
from app.teaching.models.student import Student, StudentEnrollment, FeePayment
from app.teaching.models.user import User
from app.teaching.schemas.student import (
    StudentCreate,
    StudentUpdate,
    BulkStudentCreate,
    EnrollmentCreate,
    EnrollmentUpdate,
    FeePaymentCreate,
    BulkEnrollmentCreate,
    EnrollmentsBulkCreate,
)
from app.teaching.repositories.student import student_repository, enrollment_repository
from app.teaching.repositories.class_model import class_repository


class StudentService:
    """Service for Student (identity) operations."""
    
    async def create(self, db: AsyncSession, data: StudentCreate) -> Student:
        student = Student(**data.model_dump())
        return await student_repository.add(db, student)

    async def create_bulk(
        self, db: AsyncSession, data: BulkStudentCreate
    ) -> list[Student]:
        """Create multiple student identities in a single transaction."""
        if not data.students:
            return []
        students = [Student(**s.model_dump()) for s in data.students]
        return await student_repository.add_bulk(db, students)

    async def get(self, db: AsyncSession, id: UUID) -> Student | None:
        return await student_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> Student:
        student = await student_repository.get(db, id)
        if not student:
            raise NotFoundError("Student not found")
        return student

    async def list_by_school(self, db: AsyncSession, school_id: UUID) -> list[Student]:
        return await student_repository.list_by_school(db, school_id)

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[Student]:
        return await student_repository.list_by_organization(db, organization_id)

    async def update(self, db: AsyncSession, id: UUID, data: StudentUpdate) -> Student:
        student = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(student, k, v)
        return await student_repository.update(db, student)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        student = await self.get_or_404(db, id)
        # Delete dependents explicitly so delete works regardless of DB CASCADE
        enrollments = await enrollment_repository.list_by_student(db, id)
        enrollment_ids = [e.id for e in enrollments]
        if enrollment_ids:
            await db.execute(delete(FeePayment).where(FeePayment.enrollment_id.in_(enrollment_ids)))
        for enrollment in enrollments:
            await enrollment_repository.delete(db, enrollment)
        await db.execute(delete(LeaveRequest).where(LeaveRequest.student_id == id))
        await db.execute(update(User).where(User.student_id == id).values(student_id=None))
        await db.execute(update(Student).where(Student.sibling_id == id).values(sibling_id=None))
        await db.flush()
        await student_repository.delete(db, student)


class EnrollmentService:
    """Service for StudentEnrollment (session-specific) operations."""
    
    async def create(self, db: AsyncSession, data: EnrollmentCreate) -> StudentEnrollment:
        """Create a new enrollment. Optionally inherit fees from class if not provided."""
        enrollment_data = data.model_dump()
        
        # If class is specified and fees are not provided, inherit from class
        if enrollment_data.get("class_id"):
            class_obj = await class_repository.get(db, enrollment_data["class_id"])
            if class_obj:
                if enrollment_data.get("registration_fees") is None:
                    enrollment_data["registration_fees"] = class_obj.registration_fees
                if enrollment_data.get("annual_fund") is None:
                    enrollment_data["annual_fund"] = class_obj.annual_fund
                if enrollment_data.get("monthly_fees") is None:
                    enrollment_data["monthly_fees"] = class_obj.monthly_fees
                if enrollment_data.get("due_day_of_month") is None:
                    enrollment_data["due_day_of_month"] = class_obj.due_day_of_month
                if enrollment_data.get("late_fee_amount") is None:
                    enrollment_data["late_fee_amount"] = class_obj.late_fee_amount
                if enrollment_data.get("late_fee_frequency") is None:
                    enrollment_data["late_fee_frequency"] = class_obj.late_fee_frequency
        
        enrollment = StudentEnrollment(**enrollment_data)
        return await enrollment_repository.add(db, enrollment)

    async def create_bulk_enrollments(
        self, db: AsyncSession, data: EnrollmentsBulkCreate
    ) -> list[StudentEnrollment]:
        """Create multiple enrollments with per-row fee structure (e.g. after bulk student import)."""
        if not data.enrollments:
            return []
        to_add = []
        for item in data.enrollments:
            existing = await enrollment_repository.get_by_student_and_session(
                db, item.student_id, item.session_id
            )
            if existing:
                continue
            enrollment_data = item.model_dump()
            if enrollment_data.get("class_id"):
                class_obj = await class_repository.get(db, enrollment_data["class_id"])
                if class_obj:
                    if enrollment_data.get("registration_fees") is None:
                        enrollment_data["registration_fees"] = class_obj.registration_fees
                    if enrollment_data.get("annual_fund") is None:
                        enrollment_data["annual_fund"] = class_obj.annual_fund
                    if enrollment_data.get("monthly_fees") is None:
                        enrollment_data["monthly_fees"] = class_obj.monthly_fees
                    if enrollment_data.get("due_day_of_month") is None:
                        enrollment_data["due_day_of_month"] = class_obj.due_day_of_month
                    if enrollment_data.get("late_fee_amount") is None:
                        enrollment_data["late_fee_amount"] = class_obj.late_fee_amount
                    if enrollment_data.get("late_fee_frequency") is None:
                        enrollment_data["late_fee_frequency"] = class_obj.late_fee_frequency
            to_add.append(StudentEnrollment(**enrollment_data))
        if to_add:
            return await enrollment_repository.add_bulk(db, to_add)
        return []

    async def create_bulk(
        self, db: AsyncSession, data: BulkEnrollmentCreate
    ) -> list[StudentEnrollment]:
        """Create multiple enrollments for students in a session."""
        enrollments = []
        
        # Get class defaults if class_id is provided
        class_defaults = {}
        if data.class_id:
            class_obj = await class_repository.get(db, data.class_id)
            if class_obj:
                class_defaults = {
                    "registration_fees": data.registration_fees or class_obj.registration_fees,
                    "annual_fund": data.annual_fund or class_obj.annual_fund,
                    "monthly_fees": data.monthly_fees or class_obj.monthly_fees,
                    "due_day_of_month": data.due_day_of_month or class_obj.due_day_of_month,
                    "late_fee_amount": data.late_fee_amount or class_obj.late_fee_amount,
                    "late_fee_frequency": data.late_fee_frequency or class_obj.late_fee_frequency,
                }
        else:
            class_defaults = {
                "registration_fees": data.registration_fees,
                "annual_fund": data.annual_fund,
                "monthly_fees": data.monthly_fees,
                "due_day_of_month": data.due_day_of_month,
                "late_fee_amount": data.late_fee_amount,
                "late_fee_frequency": data.late_fee_frequency,
            }
        
        for student_id in data.student_ids:
            # Check if enrollment already exists
            existing = await enrollment_repository.get_by_student_and_session(
                db, student_id, data.session_id
            )
            if existing:
                continue  # Skip if already enrolled
            
            enrollment = StudentEnrollment(
                student_id=student_id,
                session_id=data.session_id,
                class_id=data.class_id,
                registration_paid=False,
                annual_fund_paid=False,
                **class_defaults,
            )
            enrollments.append(enrollment)
        
        if enrollments:
            return await enrollment_repository.add_bulk(db, enrollments)
        return []

    async def get(self, db: AsyncSession, id: UUID) -> StudentEnrollment | None:
        return await enrollment_repository.get(db, id)

    async def get_or_404(self, db: AsyncSession, id: UUID) -> StudentEnrollment:
        enrollment = await enrollment_repository.get(db, id)
        if not enrollment:
            raise NotFoundError("Enrollment not found")
        return enrollment

    async def list_by_session(self, db: AsyncSession, session_id: UUID) -> list[StudentEnrollment]:
        return await enrollment_repository.list_by_session(db, session_id)

    async def list_by_student(self, db: AsyncSession, student_id: UUID) -> list[StudentEnrollment]:
        return await enrollment_repository.list_by_student(db, student_id)

    async def list_by_organization(self, db: AsyncSession, organization_id: UUID) -> list[StudentEnrollment]:
        return await enrollment_repository.list_by_organization(db, organization_id)

    async def list_by_session_paginated(
        self,
        db: AsyncSession,
        session_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[StudentEnrollment], int]:
        total = await enrollment_repository.count_by_session(db, session_id)
        items = await enrollment_repository.list_by_session_paginated(
            db, session_id, limit=limit, offset=offset
        )
        return items, total

    async def list_by_organization_paginated(
        self,
        db: AsyncSession,
        organization_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[StudentEnrollment], int]:
        total = await enrollment_repository.count_by_organization(db, organization_id)
        items = await enrollment_repository.list_by_organization_paginated(
            db, organization_id, limit=limit, offset=offset
        )
        return items, total

    async def update(self, db: AsyncSession, id: UUID, data: EnrollmentUpdate) -> StudentEnrollment:
        enrollment = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(enrollment, k, v)
        return await enrollment_repository.update(db, enrollment)

    async def delete(self, db: AsyncSession, id: UUID) -> None:
        enrollment = await self.get_or_404(db, id)
        await enrollment_repository.delete(db, enrollment)

    async def add_payment(
        self, db: AsyncSession, enrollment_id: UUID, data: FeePaymentCreate
    ) -> FeePayment:
        await self.get_or_404(db, enrollment_id)
        return await enrollment_repository.add_payment(
            db,
            enrollment_id,
            payment_date=data.date,
            amount=data.amount,
            method=data.method,
            receipt_number=data.receipt_number,
            fee_category=data.fee_category,
            month=data.month,
            receipt_photo_url=data.receipt_photo_url,
        )

    async def delete_payment(
        self, db: AsyncSession, enrollment_id: UUID, payment_id: UUID
    ) -> bool:
        await self.get_or_404(db, enrollment_id)
        return await enrollment_repository.delete_payment(db, payment_id, enrollment_id)


student_service = StudentService()
enrollment_service = EnrollmentService()
