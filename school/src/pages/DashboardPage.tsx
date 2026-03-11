import { useApp } from "../context/AppContext";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { SkeletonFinancialDashboard } from "../components/ui/Skeleton";
import { formatCurrency } from "../lib/utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Clock, Users, AlertCircle, CheckCircle, Package } from "lucide-react";

const STATUS_COLORS = { "Fully Paid": "#22c55e", "Partially Paid": "#eab308", "Not Paid": "#ef4444" };
const EXPENSE_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899", "#6b7280", "#10b981", "#f97316"];

export function DashboardPage() {
  const { selectedSessionId } = useApp();
  const { data: stats, isLoading } = useDashboardStats(selectedSessionId);

  if (!selectedSessionId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400">
            Select a school and session to view the dashboard.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !stats) {
    return <SkeletonFinancialDashboard />;
  }

  const collectionRate =
    stats.totalExpectedFees > 0
      ? ((stats.feeIncomeReceived / stats.totalExpectedFees) * 100).toFixed(1)
      : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Financial Dashboard</h2>
      </div>

      {/* Income & Expenses breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200 dark:border-green-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-green-800 dark:text-green-200">
              <TrendingUp className="h-5 w-5" />
              Income
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">From students</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.feeIncomeReceived)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Student fees received</p>
            </div>
            {stats.stockSalesIncome > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Stock sales</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(stats.stockSalesIncome)}</p>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total income received</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(stats.totalIncomeReceived)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-red-800 dark:text-red-200">
              <TrendingDown className="h-5 w-5" />
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">From teachers</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.salaryExpenses)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Salary payments</p>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Other expenses</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(stats.stockPurchaseExpenses + stats.fixedCostExpenses + stats.otherExpenses)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stock: {formatCurrency(stats.stockPurchaseExpenses)} · Fixed: {formatCurrency(stats.fixedCostExpenses)} · Other: {formatCurrency(stats.otherExpenses)}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total expenses</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatCurrency(stats.totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Net Profit/Loss</p>
                <p className={`text-2xl font-bold ${stats.net >= 0 ? "text-green-600" : "text-red-600 dark:text-red-400"}`}>
                  {formatCurrency(stats.net)}
                </p>
              </div>
              {stats.net >= 0 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Students Enrolled</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.studentCount}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stats.staffCount} staff members</p>
              </div>
              <Users className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expected Income Section */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Clock className="h-5 w-5" />
            Expected Income (Pending Collection)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Total Pending Fees</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{formatCurrency(stats.pendingFeeAmount)}</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">{stats.pendingCount} students with pending payments</p>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Total Expected (Annual)</p>
              <p className="text-xl font-semibold text-amber-800 dark:text-amber-200">{formatCurrency(stats.totalExpectedFees)}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Based on enrolled students&apos; fee structure</p>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Collection Rate</p>
              <p className="text-xl font-semibold text-amber-800 dark:text-amber-200">
                {typeof collectionRate === "string" && collectionRate !== "N/A" ? `${collectionRate}%` : collectionRate}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Of expected annual fees collected</p>
            </div>
          </div>
          
          {stats.expectedIncomeBreakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">Pending by Class:</p>
              <div className="flex flex-wrap gap-2">
                {stats.expectedIncomeBreakdown.slice(0, 6).map(({ className, amount }) => (
                  <span key={className} className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/50 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                    {className}: {formatCurrency(amount)}
                  </span>
                ))}
                {stats.expectedIncomeBreakdown.length > 6 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/50 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                    +{stats.expectedIncomeBreakdown.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Obligations Section */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Monthly Fixed Costs</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(stats.monthlyFixedCosts)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stats.activeFixedCostsCount} active fixed costs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Annual Salary Obligation</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(stats.annualSalaryObligation)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Paid so far: {formatCurrency(stats.salaryExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Annual Fixed Costs Obligation</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(stats.annualFixedCostsObligation)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Paid so far: {formatCurrency(stats.fixedCostExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Overview */}
      {(stats.stockOverview.activeStocks > 0 || stats.stockOverview.settledStocks > 0 || stats.stockOverview.totalPurchased > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Stock Purchased</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.stockOverview.totalPurchased)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Stock Sold (Income)</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.stockOverview.totalSold)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Stock Returned</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.stockOverview.totalReturned)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active / Settled</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  {stats.stockOverview.activeStocks} / {stats.stockOverview.settledStocks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.expenseByCategory.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No expenses yet.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {stats.expenseByCategory.map((_, i) => (
                        <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => (typeof v === "number" ? formatCurrency(v) : String(v ?? ""))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.statusDistribution.every((d) => d.count === 0) ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No students.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusDistribution.filter((d) => d.count > 0)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {stats.statusDistribution.filter((d) => d.count > 0).map((d) => (
                        <Cell key={d.name} fill={STATUS_COLORS[d.name as keyof typeof STATUS_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Cash Flow */}
      {stats.monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v) => (typeof v === "number" ? formatCurrency(v) : String(v ?? ""))} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
