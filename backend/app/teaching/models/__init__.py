"""Teaching SQLAlchemy models."""
from app.core.database import TeachingBase
from app.teaching.models.role import Role, Permission, RolePermission
from app.teaching.models.user import User
from app.teaching.models.organization import Organization
from app.teaching.models.school import School, Session
from app.teaching.models.class_model import Class
from app.teaching.models.student import Student, FeePayment
from app.teaching.models.staff import Staff, SalaryPayment
from app.teaching.models.expense import Expense
from app.teaching.models.fixed_cost import FixedMonthlyCost
from app.teaching.models.stock import Stock, StockTransaction
from app.teaching.models.leave import LeaveType, LeaveBalance, LeaveRequest
from app.teaching.models.subscription import UserSubscription, PremiumCoupon, CouponRedemption

__all__ = [
    "TeachingBase",
    "Organization",
    "Role",
    "Permission",
    "RolePermission",
    "User",
    "School",
    "Session",
    "Class",
    "Student",
    "FeePayment",
    "Staff",
    "SalaryPayment",
    "Expense",
    "FixedMonthlyCost",
    "Stock",
    "StockTransaction",
    "LeaveType",
    "LeaveBalance",
    "LeaveRequest",
    "UserSubscription",
    "PremiumCoupon",
    "CouponRedemption",
]
