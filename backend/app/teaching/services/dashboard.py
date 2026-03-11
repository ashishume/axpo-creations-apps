"""Dashboard stats service — computes all metrics server-side for a given session."""
from __future__ import annotations

from collections import defaultdict
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.teaching.models.student import StudentEnrollment
from app.teaching.models.staff import Staff
from app.teaching.models.expense import Expense
from app.teaching.models.stock import Stock, StockTransaction
from app.teaching.models.class_model import Class
from app.teaching.models.fixed_cost import FixedMonthlyCost
from app.teaching.schemas.dashboard import (
    DashboardStatsResponse,
    MonthlyDataPoint,
    CategoryAmount,
    StatusCount,
    ClassPending,
    StockOverview,
)

_ZERO = Decimal(0)


def _f(v: Decimal | float) -> float:
    return float(v) if v else 0.0


def _calc_total_annual_fees(enrollment: StudentEnrollment, class_map: dict[UUID, Class]) -> float:
    cls = class_map.get(enrollment.class_id) if enrollment.class_id else None
    reg = float(enrollment.registration_fees or (cls.registration_fees if cls else _ZERO))
    ann = float(enrollment.annual_fund or (cls.annual_fund if cls else _ZERO))
    monthly = float(enrollment.monthly_fees or (cls.monthly_fees if cls else _ZERO))
    transport = float(enrollment.transport_fees or _ZERO)
    sibling_disc = 0.3 if (enrollment.student and enrollment.student.sibling_id) else 0
    discounted = monthly * (1 - sibling_disc)
    return reg + ann + (discounted * 12) + (transport * 12)


def _get_target(enrollment: StudentEnrollment, class_map: dict[UUID, Class]) -> float:
    if enrollment.target_amount and float(enrollment.target_amount) > 0:
        return float(enrollment.target_amount)
    return _calc_total_annual_fees(enrollment, class_map)


def _total_paid(enrollment: StudentEnrollment) -> float:
    return sum(float(p.amount) for p in enrollment.payments)


async def compute_dashboard_stats(
    db: AsyncSession, session_id: UUID
) -> DashboardStatsResponse:
    enrollments_q = await db.execute(
        select(StudentEnrollment)
        .where(StudentEnrollment.session_id == session_id)
        .options(
            selectinload(StudentEnrollment.student),
            selectinload(StudentEnrollment.payments),
        )
    )
    enrollments = list(enrollments_q.scalars().all())

    staff_q = await db.execute(
        select(Staff).where(Staff.session_id == session_id)
    )
    staff_list = list(staff_q.scalars().all())

    expenses_q = await db.execute(
        select(Expense).where(Expense.session_id == session_id)
    )
    expenses = list(expenses_q.scalars().all())

    stocks_q = await db.execute(
        select(Stock).where(Stock.session_id == session_id)
    )
    stocks = list(stocks_q.scalars().all())

    classes_q = await db.execute(
        select(Class).where(Class.session_id == session_id)
    )
    classes = list(classes_q.scalars().all())
    class_map: dict[UUID, Class] = {c.id: c for c in classes}

    fc_q = await db.execute(
        select(FixedMonthlyCost).where(
            FixedMonthlyCost.session_id == session_id,
            FixedMonthlyCost.is_active == True,  # noqa: E712
        )
    )
    fixed_costs = list(fc_q.scalars().all())

    # --- Income ---
    fee_income = sum(_total_paid(e) for e in enrollments)
    stock_sales = 0.0
    stock_returns = 0.0
    for st in stocks:
        for tx in st.transactions:
            if tx.type == "sale":
                stock_sales += float(tx.amount)
            elif tx.type == "return":
                stock_returns += float(tx.amount)
    total_income = fee_income + stock_sales

    # --- Expenses ---
    total_exp = sum(float(e.amount) for e in expenses)
    stock_purchase_exp = sum(float(e.amount) for e in expenses if e.category == "Stock Purchase")
    salary_exp = sum(float(e.amount) for e in expenses if e.category == "Salary")
    fc_exp = sum(float(e.amount) for e in expenses if e.category == "Fixed Cost")
    other_exp = total_exp - stock_purchase_exp - salary_exp - fc_exp

    # --- Pending / Expected ---
    total_expected = sum(_calc_total_annual_fees(e, class_map) for e in enrollments)
    pending_amount = sum(max(0.0, _get_target(e, class_map) - _total_paid(e)) for e in enrollments)
    pending_count = sum(1 for e in enrollments if _total_paid(e) < _get_target(e, class_map))

    # --- Obligations ---
    monthly_fc = sum(float(fc.amount) for fc in fixed_costs)
    annual_salary = sum(float(st.monthly_salary) * 12 for st in staff_list)

    net = total_income - total_exp

    # --- Monthly data ---
    by_month: dict[str, dict[str, float]] = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})
    for e in enrollments:
        for p in e.payments:
            m = str(p.date)[:7]
            by_month[m]["income"] += float(p.amount)
    for st in stocks:
        for tx in st.transactions:
            if tx.type == "sale":
                m = str(tx.date)[:7]
                by_month[m]["income"] += float(tx.amount)
    for e in expenses:
        m = str(e.date)[:7]
        by_month[m]["expenses"] += float(e.amount)
    monthly_data = sorted(
        [MonthlyDataPoint(month=k, income=v["income"], expenses=v["expenses"]) for k, v in by_month.items()],
        key=lambda x: x.month,
    )

    # --- Expense by category ---
    cat_map: dict[str, float] = defaultdict(float)
    for e in expenses:
        cat_map[e.category] += float(e.amount)
    expense_by_cat = [CategoryAmount(name=k, value=v) for k, v in cat_map.items()]

    # --- Status distribution ---
    fully = partially = not_paid = 0
    for e in enrollments:
        paid = _total_paid(e)
        target = _get_target(e, class_map)
        if paid >= target:
            fully += 1
        elif paid > 0:
            partially += 1
        else:
            not_paid += 1
    status_dist = [
        StatusCount(name="Fully Paid", count=fully),
        StatusCount(name="Partially Paid", count=partially),
        StatusCount(name="Not Paid", count=not_paid),
    ]

    # --- Expected income breakdown by class ---
    pending_by_class: dict[str, float] = defaultdict(float)
    for e in enrollments:
        remaining = max(0.0, _get_target(e, class_map) - _total_paid(e))
        if remaining > 0:
            cls = class_map.get(e.class_id) if e.class_id else None
            cls_name = cls.name if cls else "Unassigned"
            pending_by_class[cls_name] += remaining
    breakdown = sorted(
        [ClassPending(class_name=k, amount=v) for k, v in pending_by_class.items()],
        key=lambda x: -x.amount,
    )

    # --- Stock overview ---
    stock_ov = StockOverview(
        total_purchased=sum(float(s.total_credit_amount) for s in stocks),
        total_sold=stock_sales,
        total_returned=stock_returns,
        active_stocks=sum(1 for s in stocks if s.status == "open"),
        settled_stocks=sum(1 for s in stocks if s.status == "cleared"),
    )

    return DashboardStatsResponse(
        fee_income_received=fee_income,
        stock_sales_income=stock_sales,
        total_income_received=total_income,
        total_expenses=total_exp,
        stock_purchase_expenses=stock_purchase_exp,
        salary_expenses=salary_exp,
        fixed_cost_expenses=fc_exp,
        other_expenses=other_exp,
        stock_returns_value=stock_returns,
        total_expected_fees=total_expected,
        pending_fee_amount=pending_amount,
        pending_count=pending_count,
        monthly_fixed_costs=monthly_fc,
        annual_fixed_costs_obligation=monthly_fc * 12,
        annual_salary_obligation=annual_salary,
        net=net,
        student_count=len(enrollments),
        staff_count=len(staff_list),
        active_fixed_costs_count=len(fixed_costs),
        monthly_data=monthly_data,
        expense_by_category=expense_by_cat,
        status_distribution=status_dist,
        expected_income_breakdown=breakdown,
        stock_overview=stock_ov,
    )
