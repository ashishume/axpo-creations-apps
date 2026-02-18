import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { formatCurrency } from "../lib/utils";
import { getTotalPaid, getRemaining, getPaymentStatus, getTotalAnnualFees } from "../lib/studentUtils";
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
  const {
    students,
    staff,
    expenses,
    stocks,
    classes,
    fixedCosts,
    selectedSessionId,
  } = useApp();

  const sessionStudents = useMemo(
    () => (selectedSessionId ? students.filter((s) => s.sessionId === selectedSessionId) : []),
    [students, selectedSessionId]
  );
  const sessionStaff = useMemo(
    () => (selectedSessionId ? staff.filter((s) => s.sessionId === selectedSessionId) : []),
    [staff, selectedSessionId]
  );
  const sessionExpenses = useMemo(
    () => (selectedSessionId ? expenses.filter((e) => e.sessionId === selectedSessionId) : []),
    [expenses, selectedSessionId]
  );
  const sessionStocks = useMemo(
    () => (selectedSessionId ? stocks.filter((s) => s.sessionId === selectedSessionId) : []),
    [stocks, selectedSessionId]
  );
  const sessionClasses = useMemo(
    () => (selectedSessionId ? classes.filter((c) => c.sessionId === selectedSessionId) : []),
    [classes, selectedSessionId]
  );
  const sessionFixedCosts = useMemo(
    () => (selectedSessionId ? fixedCosts.filter((fc) => fc.sessionId === selectedSessionId && fc.isActive) : []),
    [fixedCosts, selectedSessionId]
  );

  // Calculate comprehensive totals
  const totals = useMemo(() => {
    // INCOME CALCULATIONS
    // 1. Fee payments received from students
    const feeIncomeReceived = sessionStudents.reduce((s, st) => s + getTotalPaid(st), 0);
    
    // 2. Stock sales income (from transactions) – use "sale" to match Stocks tab
    const stockSalesIncome = sessionStocks.reduce((total, stock) => {
      return total + stock.transactions.reduce((txTotal, tx) => {
        if (tx.type === "sale") {
          return txTotal + tx.amount;
        }
        return txTotal;
      }, 0);
    }, 0);
    
    // Total income received
    const totalIncomeReceived = feeIncomeReceived + stockSalesIncome;
    
    // EXPENSE CALCULATIONS - All come from expenses table now
    // (Stock purchases, salaries, and manual expenses are all in the expenses table)
    const totalExpenses = sessionExpenses.reduce((s, e) => s + e.amount, 0);
    
    // Break down expenses by type
    const stockPurchaseExpenses = sessionExpenses
      .filter(e => e.category === "Stock Purchase")
      .reduce((s, e) => s + e.amount, 0);
    
    const salaryExpenses = sessionExpenses
      .filter(e => e.category === "Salary")
      .reduce((s, e) => s + e.amount, 0);
    
    const fixedCostExpenses = sessionExpenses
      .filter(e => e.category === "Fixed Cost")
      .reduce((s, e) => s + e.amount, 0);
    
    const otherExpenses = sessionExpenses
      .filter(e => !["Stock Purchase", "Salary", "Fixed Cost"].includes(e.category))
      .reduce((s, e) => s + e.amount, 0);
    
    // PENDING/EXPECTED CALCULATIONS
    // Expected income from students (total annual fees - what's paid)
    const totalExpectedFees = sessionStudents.reduce((s, st) => {
      const studentClass = sessionClasses.find(c => c.id === st.classId);
      return s + getTotalAnnualFees(st, studentClass);
    }, 0);
    const pendingFeeAmount = sessionStudents.reduce((s, st) => s + getRemaining(st), 0);
    const pendingCount = sessionStudents.filter((st) => getPaymentStatus(st) !== "Fully Paid").length;
    
    // Monthly fixed costs obligation
    const monthlyFixedCosts = sessionFixedCosts.reduce((s, fc) => s + fc.amount, 0);
    const annualFixedCostsObligation = monthlyFixedCosts * 12;
    
    // Annual salary obligation (for reference)
    const annualSalaryObligation = sessionStaff.reduce((s, st) => s + st.monthlySalary * 12, 0);
    
    // Stock returns (value returned to publishers) – use "return" to match Stocks tab
    const stockReturnsValue = sessionStocks.reduce((total, stock) => {
      return total + stock.transactions.reduce((txTotal, tx) => {
        if (tx.type === "return") {
          return txTotal + tx.amount;
        }
        return txTotal;
      }, 0);
    }, 0);
    
    // Net calculation
    const net = totalIncomeReceived - totalExpenses;
    
    return {
      // Income
      feeIncomeReceived,
      stockSalesIncome,
      totalIncomeReceived,
      // Expenses
      totalExpenses,
      stockPurchaseExpenses,
      salaryExpenses,
      fixedCostExpenses,
      otherExpenses,
      stockReturnsValue,
      // Pending/Expected
      totalExpectedFees,
      pendingFeeAmount,
      pendingCount,
      // Obligations
      monthlyFixedCosts,
      annualFixedCostsObligation,
      annualSalaryObligation,
      // Net
      net,
    };
  }, [sessionStudents, sessionExpenses, sessionStaff, sessionStocks, sessionClasses, sessionFixedCosts]);

  // Monthly data for charts (without the line chart, but keeping for bar chart)
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, { month: string; income: number; expenses: number }> = {};
    
    // Fee payments as income
    sessionStudents.forEach((st) => {
      st.payments.forEach((p) => {
        const month = p.date.slice(0, 7);
        if (!byMonth[month]) byMonth[month] = { month, income: 0, expenses: 0 };
        byMonth[month].income += p.amount;
      });
    });
    
    // Stock sales as income
    sessionStocks.forEach((stock) => {
      stock.transactions.forEach((tx) => {
        if (tx.type === "sale") {
          const month = tx.date.slice(0, 7);
          if (!byMonth[month]) byMonth[month] = { month, income: 0, expenses: 0 };
          byMonth[month].income += tx.amount;
        }
      });
    });
    
    // All expenses (includes stock purchases, salaries, fixed costs, etc.)
    sessionExpenses.forEach((e) => {
      const month = e.date.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { month, income: 0, expenses: 0 };
      byMonth[month].expenses += e.amount;
    });
    
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  }, [sessionStudents, sessionExpenses, sessionStocks]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    sessionExpenses.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sessionExpenses]);

  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = { "Fully Paid": 0, "Partially Paid": 0, "Not Paid": 0 };
    sessionStudents.forEach((st) => {
      map[getPaymentStatus(st)] += 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [sessionStudents]);

  // Expected income breakdown
  const expectedIncomeBreakdown = useMemo(() => {
    const pendingByClass: Record<string, number> = {};
    sessionStudents.forEach((st) => {
      const remaining = getRemaining(st);
      if (remaining > 0) {
        const className = sessionClasses.find(c => c.id === st.classId)?.name ?? "Unassigned";
        pendingByClass[className] = (pendingByClass[className] ?? 0) + remaining;
      }
    });
    return Object.entries(pendingByClass)
      .map(([className, amount]) => ({ className, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [sessionStudents, sessionClasses]);

  // Stock overview
  const stockOverview = useMemo(() => {
    return {
      totalPurchased: sessionStocks.reduce((s, st) => s + st.totalCreditAmount, 0),
      totalSold: totals.stockSalesIncome,
      totalReturned: totals.stockReturnsValue,
      activeStocks: sessionStocks.filter(s => s.status === "open").length,
      settledStocks: sessionStocks.filter(s => s.status === "cleared").length,
    };
  }, [sessionStocks, totals.stockSalesIncome, totals.stockReturnsValue]);

  if (!selectedSessionId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Select a school and session to view the dashboard.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Financial Dashboard</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Income (Received)</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalIncomeReceived)}</p>
                <div className="mt-1 text-xs text-slate-500">
                  <span>Fees: {formatCurrency(totals.feeIncomeReceived)}</span>
                  {totals.stockSalesIncome > 0 && (
                    <span className="ml-2">Stock Sales: {formatCurrency(totals.stockSalesIncome)}</span>
                  )}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalExpenses)}</p>
                <div className="mt-1 text-xs text-slate-500">
                  {totals.salaryExpenses > 0 && <span>Salaries: {formatCurrency(totals.salaryExpenses)}</span>}
                  {totals.stockPurchaseExpenses > 0 && (
                    <span className="ml-2">Stock: {formatCurrency(totals.stockPurchaseExpenses)}</span>
                  )}
                </div>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Net Profit/Loss</p>
                <p className={`text-2xl font-bold ${totals.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(totals.net)}
                </p>
              </div>
              {totals.net >= 0 ? (
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
                <p className="text-sm text-slate-600">Students Enrolled</p>
                <p className="text-2xl font-bold text-slate-900">{sessionStudents.length}</p>
                <p className="text-xs text-slate-500">{sessionStaff.length} staff members</p>
              </div>
              <Users className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expected Income Section */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Clock className="h-5 w-5" />
            Expected Income (Pending Collection)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-amber-700">Total Pending Fees</p>
              <p className="text-3xl font-bold text-amber-900">{formatCurrency(totals.pendingFeeAmount)}</p>
              <p className="text-sm text-amber-600">{totals.pendingCount} students with pending payments</p>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700">Total Expected (Annual)</p>
              <p className="text-xl font-semibold text-amber-800">{formatCurrency(totals.totalExpectedFees)}</p>
              <p className="text-xs text-amber-600">Based on enrolled students&apos; fee structure</p>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700">Collection Rate</p>
              <p className="text-xl font-semibold text-amber-800">
                {totals.totalExpectedFees > 0 
                  ? `${((totals.feeIncomeReceived / totals.totalExpectedFees) * 100).toFixed(1)}%`
                  : "N/A"
                }
              </p>
              <p className="text-xs text-amber-600">Of expected annual fees collected</p>
            </div>
          </div>
          
          {expectedIncomeBreakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t border-amber-200">
              <p className="text-sm font-medium text-amber-700 mb-2">Pending by Class:</p>
              <div className="flex flex-wrap gap-2">
                {expectedIncomeBreakdown.slice(0, 6).map(({ className, amount }) => (
                  <span key={className} className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    {className}: {formatCurrency(amount)}
                  </span>
                ))}
                {expectedIncomeBreakdown.length > 6 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    +{expectedIncomeBreakdown.length - 6} more
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
            <p className="text-sm text-slate-600">Monthly Fixed Costs</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totals.monthlyFixedCosts)}</p>
            <p className="text-xs text-slate-500">{sessionFixedCosts.length} active fixed costs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600">Annual Salary Obligation</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totals.annualSalaryObligation)}</p>
            <p className="text-xs text-slate-500">Paid so far: {formatCurrency(totals.salaryExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600">Annual Fixed Costs Obligation</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totals.annualFixedCostsObligation)}</p>
            <p className="text-xs text-slate-500">Paid so far: {formatCurrency(totals.fixedCostExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Overview */}
      {sessionStocks.length > 0 && (
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
                <p className="text-sm text-slate-600">Total Stock Purchased</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stockOverview.totalPurchased)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Stock Sold (Income)</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stockOverview.totalSold)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Stock Returned</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(stockOverview.totalReturned)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Active / Settled</p>
                <p className="text-xl font-bold text-slate-900">
                  {stockOverview.activeStocks} / {stockOverview.settledStocks}
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
            {expenseByCategory.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No expenses yet.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {expenseByCategory.map((_, i) => (
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
            {statusDistribution.every((d) => d.count === 0) ? (
              <p className="py-8 text-center text-sm text-slate-500">No students.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution.filter((d) => d.count > 0)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusDistribution.filter((d) => d.count > 0).map((d) => (
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
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
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
