"""Dashboard stats response schemas."""
from pydantic import BaseModel


class MonthlyDataPoint(BaseModel):
    month: str
    income: float
    expenses: float


class CategoryAmount(BaseModel):
    name: str
    value: float


class StatusCount(BaseModel):
    name: str
    count: int


class ClassPending(BaseModel):
    class_name: str
    amount: float


class StockOverview(BaseModel):
    total_purchased: float
    total_sold: float
    total_returned: float
    active_stocks: int
    settled_stocks: int


class DashboardStatsResponse(BaseModel):
    fee_income_received: float
    stock_sales_income: float
    total_income_received: float

    total_expenses: float
    stock_purchase_expenses: float
    salary_expenses: float
    fixed_cost_expenses: float
    other_expenses: float
    stock_returns_value: float

    total_expected_fees: float
    pending_fee_amount: float
    pending_count: int

    monthly_fixed_costs: float
    annual_fixed_costs_obligation: float
    annual_salary_obligation: float

    net: float

    student_count: int
    staff_count: int
    active_fixed_costs_count: int

    monthly_data: list[MonthlyDataPoint]
    expense_by_category: list[CategoryAmount]
    status_distribution: list[StatusCount]
    expected_income_breakdown: list[ClassPending]
    stock_overview: StockOverview
