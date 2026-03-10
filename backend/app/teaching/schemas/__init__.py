"""Teaching Pydantic schemas."""
from app.teaching.schemas.pagination import PaginatedResponse
from app.teaching.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshResponse,
    UserResponse,
)
from app.teaching.schemas.school import SchoolCreate, SchoolUpdate, SchoolResponse
from app.teaching.schemas.session import SessionCreate, SessionUpdate, SessionResponse
from app.teaching.schemas.class_schema import ClassCreate, ClassUpdate, ClassResponse
from app.teaching.schemas.student import StudentCreate, StudentUpdate, StudentResponse
from app.teaching.schemas.staff import StaffCreate, StaffUpdate, StaffResponse
from app.teaching.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.teaching.schemas.stock import StockCreate, StockUpdate, StockResponse
from app.teaching.schemas.leave import (
    LeaveTypeCreate,
    LeaveTypeUpdate,
    LeaveTypeResponse,
    LeaveBalanceCreate,
    LeaveBalanceUpdate,
    LeaveBalanceResponse,
    LeaveRequestCreate,
    LeaveRequestUpdate,
    LeaveRequestReview,
    LeaveRequestResponse,
)

__all__ = [
    "PaginatedResponse",
    "LoginRequest",
    "LoginResponse",
    "RefreshResponse",
    "UserResponse",
    "SchoolCreate",
    "SchoolUpdate",
    "SchoolResponse",
    "SessionCreate",
    "SessionUpdate",
    "SessionResponse",
    "ClassCreate",
    "ClassUpdate",
    "ClassResponse",
    "StudentCreate",
    "StudentUpdate",
    "StudentResponse",
    "StaffCreate",
    "StaffUpdate",
    "StaffResponse",
    "ExpenseCreate",
    "ExpenseUpdate",
    "ExpenseResponse",
    "StockCreate",
    "StockUpdate",
    "StockResponse",
    "LeaveTypeCreate",
    "LeaveTypeUpdate",
    "LeaveTypeResponse",
    "LeaveBalanceCreate",
    "LeaveBalanceUpdate",
    "LeaveBalanceResponse",
    "LeaveRequestCreate",
    "LeaveRequestUpdate",
    "LeaveRequestReview",
    "LeaveRequestResponse",
]
