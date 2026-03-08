"""Student routes."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.schemas.student import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    FeePaymentCreate,
    FeePaymentResponse,
)
from app.teaching.services.student import student_service
from app.teaching.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/students", tags=["teaching-students"])


@router.post("", response_model=StudentResponse)
async def create_student(
    data: StudentCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    student = await student_service.create(db, data)
    return StudentResponse.model_validate(student)


@router.get("", response_model=list[StudentResponse])
async def list_students(
    session_id: UUID | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    if session_id:
        students = await student_service.list_by_session(db, session_id)
    else:
        students = await student_service.list_all(db)
    return [StudentResponse.model_validate(s) for s in students]


@router.post("/bulk", response_model=list[StudentResponse])
async def create_students_bulk(
    data: list[StudentCreate],
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    students = await student_service.create_many(db, data)
    return [StudentResponse.model_validate(s) for s in students]


@router.get("/{id}", response_model=StudentResponse)
async def get_student(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    student = await student_service.get_or_404(db, id)
    return StudentResponse.model_validate(student)


@router.patch("/{id}", response_model=StudentResponse)
async def update_student(
    id: UUID,
    data: StudentUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    student = await student_service.update(db, id, data)
    return StudentResponse.model_validate(student)


@router.delete("/{id}", status_code=204)
async def delete_student(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await student_service.delete(db, id)


@router.post("/{id}/payments", response_model=FeePaymentResponse)
async def add_student_payment(
    id: UUID,
    data: FeePaymentCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    payment = await student_service.add_payment(db, id, data)
    return FeePaymentResponse.model_validate(payment)


@router.delete("/{id}/payments/{payment_id}", status_code=204)
async def delete_student_payment(
    id: UUID,
    payment_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    deleted = await student_service.delete_payment(db, id, payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")
