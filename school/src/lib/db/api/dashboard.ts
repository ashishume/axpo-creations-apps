import { teachingFetchJson } from '../../api/client';

export interface MonthlyDataPoint {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryAmount {
  name: string;
  value: number;
}

export interface StatusCount {
  name: string;
  count: number;
}

export interface ClassPending {
  className: string;
  amount: number;
}

export interface StockOverview {
  totalPurchased: number;
  totalSold: number;
  totalReturned: number;
  activeStocks: number;
  settledStocks: number;
}

export interface DashboardStats {
  feeIncomeReceived: number;
  stockSalesIncome: number;
  totalIncomeReceived: number;

  totalExpenses: number;
  stockPurchaseExpenses: number;
  salaryExpenses: number;
  fixedCostExpenses: number;
  otherExpenses: number;
  stockReturnsValue: number;

  totalExpectedFees: number;
  pendingFeeAmount: number;
  pendingCount: number;

  monthlyFixedCosts: number;
  annualFixedCostsObligation: number;
  annualSalaryObligation: number;

  net: number;

  studentCount: number;
  staffCount: number;
  activeFixedCostsCount: number;

  monthlyData: MonthlyDataPoint[];
  expenseByCategory: CategoryAmount[];
  statusDistribution: StatusCount[];
  expectedIncomeBreakdown: ClassPending[];
  stockOverview: StockOverview;
}

function mapStats(r: Record<string, unknown>): DashboardStats {
  const so = r.stock_overview as Record<string, unknown> | undefined;
  return {
    feeIncomeReceived: Number(r.fee_income_received ?? 0),
    stockSalesIncome: Number(r.stock_sales_income ?? 0),
    totalIncomeReceived: Number(r.total_income_received ?? 0),
    totalExpenses: Number(r.total_expenses ?? 0),
    stockPurchaseExpenses: Number(r.stock_purchase_expenses ?? 0),
    salaryExpenses: Number(r.salary_expenses ?? 0),
    fixedCostExpenses: Number(r.fixed_cost_expenses ?? 0),
    otherExpenses: Number(r.other_expenses ?? 0),
    stockReturnsValue: Number(r.stock_returns_value ?? 0),
    totalExpectedFees: Number(r.total_expected_fees ?? 0),
    pendingFeeAmount: Number(r.pending_fee_amount ?? 0),
    pendingCount: Number(r.pending_count ?? 0),
    monthlyFixedCosts: Number(r.monthly_fixed_costs ?? 0),
    annualFixedCostsObligation: Number(r.annual_fixed_costs_obligation ?? 0),
    annualSalaryObligation: Number(r.annual_salary_obligation ?? 0),
    net: Number(r.net ?? 0),
    studentCount: Number(r.student_count ?? 0),
    staffCount: Number(r.staff_count ?? 0),
    activeFixedCostsCount: Number(r.active_fixed_costs_count ?? 0),
    monthlyData: Array.isArray(r.monthly_data)
      ? (r.monthly_data as Record<string, unknown>[]).map((m) => ({
          month: String(m.month ?? ''),
          income: Number(m.income ?? 0),
          expenses: Number(m.expenses ?? 0),
        }))
      : [],
    expenseByCategory: Array.isArray(r.expense_by_category)
      ? (r.expense_by_category as Record<string, unknown>[]).map((c) => ({
          name: String(c.name ?? ''),
          value: Number(c.value ?? 0),
        }))
      : [],
    statusDistribution: Array.isArray(r.status_distribution)
      ? (r.status_distribution as Record<string, unknown>[]).map((s) => ({
          name: String(s.name ?? ''),
          count: Number(s.count ?? 0),
        }))
      : [],
    expectedIncomeBreakdown: Array.isArray(r.expected_income_breakdown)
      ? (r.expected_income_breakdown as Record<string, unknown>[]).map((e) => ({
          className: String(e.class_name ?? ''),
          amount: Number(e.amount ?? 0),
        }))
      : [],
    stockOverview: so
      ? {
          totalPurchased: Number(so.total_purchased ?? 0),
          totalSold: Number(so.total_sold ?? 0),
          totalReturned: Number(so.total_returned ?? 0),
          activeStocks: Number(so.active_stocks ?? 0),
          settledStocks: Number(so.settled_stocks ?? 0),
        }
      : { totalPurchased: 0, totalSold: 0, totalReturned: 0, activeStocks: 0, settledStocks: 0 },
  };
}

export const dashboardRepositoryApi = {
  async getStats(sessionId: string): Promise<DashboardStats> {
    const r = await teachingFetchJson<Record<string, unknown>>(
      `/dashboard/stats?session_id=${sessionId}`
    );
    return mapStats(r);
  },
};
