"""Teaching services."""
from app.teaching.services.auth import auth_service
from app.teaching.services.school import school_service
from app.teaching.services.session import session_service
from app.teaching.services.class_service import class_service
from app.teaching.services.student import student_service
from app.teaching.services.staff import staff_service
from app.teaching.services.expense import expense_service
from app.teaching.services.stock import stock_service

__all__ = [
    "auth_service",
    "school_service",
    "session_service",
    "class_service",
    "student_service",
    "staff_service",
    "expense_service",
    "stock_service",
]
