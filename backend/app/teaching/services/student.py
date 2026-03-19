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
    StudentCreateWithEnrollment,
    StudentUpdate,
    StudentUpdateWithEnrollment,
    BulkStudentCreate,
    EnrollmentCreate,
    EnrollmentUpdate,
    FeePaymentCreate,
    BulkEnrollmentCreate,
    EnrollmentsBulkCreate,
    TransferStudentsCreate,
)
from app.teaching.repositories.student import student_repository, enrollment_repository
from app.teaching.repositories.class_model import class_repository
from app.teaching.repositories.session import session_repository


class StudentService:
    """Service for Student (identity) operations."""
    
    async def create(self, db: AsyncSession, data: StudentCreate) -> Student:
        student = Student(**data.model_dump())
        return await student_repository.add(db, student)

    async def create_with_enrollment(
        self, db: AsyncSession, data: StudentCreateWithEnrollment
    ) -> tuple[Student, StudentEnrollment]:
        """Create student identity and enroll in a session in one transaction."""
        session = await session_repository.get(db, data.session_id)
        if not session:
            raise NotFoundError("Session not found")
        # Student fields only (exclude enrollment fields)
        enrollment_fields = {
            "session_id", "class_id", "registration_fees", "annual_fund", "monthly_fees",
            "transport_fees", "registration_paid", "annual_fund_paid", "due_day_of_month",
            "late_fee_amount", "late_fee_frequency",
        }
        student_dict = {k: v for k, v in data.model_dump().items() if k not in enrollment_fields}
        student_dict["school_id"] = session.school_id
        student = Student(**student_dict)
        student = await student_repository.add(db, student)
        # Create enrollment
        enrollment_data = EnrollmentCreate(
            student_id=student.id,
            session_id=data.session_id,
            class_id=data.class_id,
            registration_fees=data.registration_fees,
            annual_fund=data.annual_fund,
            monthly_fees=data.monthly_fees,
            transport_fees=data.transport_fees,
            registration_paid=data.registration_paid,
            annual_fund_paid=data.annual_fund_paid,
            due_day_of_month=data.due_day_of_month,
            late_fee_amount=data.late_fee_amount,
            late_fee_frequency=data.late_fee_frequency,
        )
        enrollment = await enrollment_service.create(db, enrollment_data)
        return student, enrollment

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

    async def list_by_organization_paginated(
        self,
        db: AsyncSession,
        organization_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[Student], int]:
        """Return (items, total) for DB-level pagination."""
        total = await student_repository.count_by_organization(db, organization_id)
        items = await student_repository.list_by_organization_paginated(
            db, organization_id, limit=limit, offset=offset
        )
        return items, total

    async def update(self, db: AsyncSession, id: UUID, data: StudentUpdate) -> Student:
        student = await self.get_or_404(db, id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(student, k, v)
        return await student_repository.update(db, student)

    async def update_student_and_enrollment(
        self, db: AsyncSession, student_id: UUID, data: StudentUpdateWithEnrollment
    ) -> StudentEnrollment:
        """Update both student identity and the given enrollment in one transaction. Returns the enrollment (with student and payments loaded)."""
        student = await self.get_or_404(db, student_id)
        enrollment = await enrollment_repository.get(db, data.enrollment_id)
        if not enrollment:
            raise NotFoundError("Enrollment not found")
        if enrollment.student_id != student_id:
            raise NotFoundError("Enrollment does not belong to this student")
        dump = data.model_dump(exclude_unset=True)
        enrollment_id = dump.pop("enrollment_id", None)
        enrollment_field_names = {
            "class_id", "registration_fees", "annual_fund", "monthly_fees", "transport_fees",
            "registration_paid", "annual_fund_paid", "due_day_of_month", "late_fee_amount", "late_fee_frequency",
        }
        student_updates = {k: v for k, v in dump.items() if k not in enrollment_field_names}
        enrollment_updates = {k: v for k, v in dump.items() if k in enrollment_field_names}
        if student_updates:
            for k, v in student_updates.items():
                setattr(student, k, v)
            await student_repository.update(db, student)
        if enrollment_updates:
            for k, v in enrollment_updates.items():
                setattr(enrollment, k, v)
            await enrollment_repository.update(db, enrollment)
        await db.refresh(enrollment)
        return enrollment

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

    async def delete_all_by_session(self, db: AsyncSession, session_id: UUID) -> int:
        """Delete all students enrolled in the given session (and their enrollments/payments). Returns count deleted."""
        enrollments = await enrollment_repository.list_by_session(db, session_id)
        student_ids = list({e.student_id for e in enrollments})
        for sid in student_ids:
            await self.delete(db, sid)
        return len(student_ids)


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

    async def transfer_to_session(
        self, db: AsyncSession, data: TransferStudentsCreate
    ) -> int:
        """Copy students from one session to another: copy enrollment and fee details, reset payment status.
        Does not copy any payment records. Maps class to target session by class name."""
        from_session_id = data.from_session_id
        to_session_id = data.to_session_id
        student_ids = data.student_ids
        if not student_ids:
            return 0

        target_classes = await class_repository.list_by_session(db, to_session_id)
        name_to_class_id = {c.name: c.id for c in target_classes}

        to_add: list[StudentEnrollment] = []
        for student_id in student_ids:
            existing_in_target = await enrollment_repository.get_by_student_and_session(
                db, student_id, to_session_id
            )
            if existing_in_target:
                continue
            source = await enrollment_repository.get_by_student_and_session(
                db, student_id, from_session_id
            )
            if not source:
                continue

            target_class_id = None
            if source.class_id:
                source_class = await class_repository.get(db, source.class_id)
                if source_class and source_class.name in name_to_class_id:
                    target_class_id = name_to_class_id[source_class.name]

            new_enrollment = StudentEnrollment(
                student_id=student_id,
                session_id=to_session_id,
                class_id=target_class_id,
                registration_fees=source.registration_fees,
                annual_fund=source.annual_fund,
                monthly_fees=source.monthly_fees,
                transport_fees=source.transport_fees,
                due_day_of_month=source.due_day_of_month,
                late_fee_amount=source.late_fee_amount,
                late_fee_frequency=source.late_fee_frequency,
                target_amount=source.target_amount,
                fine_per_day=source.fine_per_day,
                due_frequency=source.due_frequency,
                registration_paid=False,
                annual_fund_paid=False,
            )
            to_add.append(new_enrollment)

        if to_add:
            await enrollment_repository.add_bulk(db, to_add)
        return len(to_add)

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
        search: str | None = None,
        class_id: UUID | None = None,
    ) -> tuple[list[StudentEnrollment], int]:
        total = await enrollment_repository.count_by_session(
            db, session_id, search=search, class_id=class_id
        )
        items = await enrollment_repository.list_by_session_paginated(
            db,
            session_id,
            limit=limit,
            offset=offset,
            search=search,
            class_id=class_id,
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
