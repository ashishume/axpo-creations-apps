"""Teaching repositories: DB operations only."""

from app.teaching.repositories.organization import OrganizationRepository
from app.teaching.repositories.school import SchoolRepository
from app.teaching.repositories.session import SessionRepository
from app.teaching.repositories.class_model import ClassRepository
from app.teaching.repositories.student import StudentRepository
from app.teaching.repositories.staff import StaffRepository
from app.teaching.repositories.expense import ExpenseRepository
from app.teaching.repositories.stock import StockRepository
from app.teaching.repositories.fixed_cost import FixedCostRepository
from app.teaching.repositories.role import RoleRepository

__all__ = [
    "OrganizationRepository",
    "SchoolRepository",
    "SessionRepository",
    "ClassRepository",
    "StudentRepository",
    "StaffRepository",
    "ExpenseRepository",
    "StockRepository",
    "FixedCostRepository",
    "RoleRepository",
]
