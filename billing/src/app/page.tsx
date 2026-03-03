import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Package, Users, FileText, CreditCard, Receipt, AlertTriangle, BarChart3, TrendingUp, Wallet } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { Card, PieChart, Skeleton } from "@/components/ui";

const CHART_MONTHS = 6;

function getMonthKeys(count: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const y = m.getFullYear();
    const month = m.getMonth() + 1;
    keys.push(`${y}-${String(month).padStart(2, "0")}`);
  }
  return keys;
}

function formatMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

const STAT_ICONS = {
  products: Package,
  customers: Users,
  invoices: FileText,
  payments: CreditCard,
  expenses: Receipt,
} as const;

export function DashboardPage() {
  const { data, loading } = useStore();

  const company = data?.company ?? null;
  const productCount = data?.products.length ?? 0;
  const customerCount = data?.customers.length ?? 0;
  const invoiceCount = data?.invoices.filter((i) => i.status === "final").length ?? 0;
  const paymentCount = data?.payments.length ?? 0;
  const expenseCount = data?.expenses.length ?? 0;

  const stats = [
    { label: "Products", value: productCount, href: "/products", iconKey: "products" as const, iconBg: "bg-blue-100 border-blue-200", iconColor: "text-blue-600" },
    { label: "Customers", value: customerCount, href: "/customers", iconKey: "customers" as const, iconBg: "bg-emerald-100 border-emerald-200", iconColor: "text-emerald-600" },
    { label: "Invoices", value: invoiceCount, href: "/invoices", iconKey: "invoices" as const, iconBg: "bg-violet-100 border-violet-200", iconColor: "text-violet-600" },
    { label: "Payments", value: paymentCount, href: "/payments", iconKey: "payments" as const, iconBg: "bg-amber-100 border-amber-200", iconColor: "text-amber-600" },
    { label: "Expenses", value: expenseCount, href: "/expenses", iconKey: "expenses" as const, iconBg: "bg-rose-100 border-rose-200", iconColor: "text-rose-600" },
  ];

  // Calculate sales by product for pie chart
  const salesByProduct = useMemo(() => {
    if (!data) return [];
    const productSales: Record<string, number> = {};
    data.invoiceItems.forEach((item) => {
      const invoice = data.invoices.find((inv) => inv.id === item.invoiceId);
      if (invoice?.status === "final") {
        const product = data.products.find((p) => p.id === item.productId);
        const productName = product?.name || "Unknown";
        productSales[productName] = (productSales[productName] || 0) + (item.lineTotal || 0);
      }
    });
    
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
    return Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([label, value], idx) => ({
        label,
        value,
        color: colors[idx % colors.length],
      }));
  }, [data]);

  // Calculate expenses by category for pie chart
  const expensesByCategory = useMemo(() => {
    if (!data) return [];
    const categoryExpenses: Record<string, number> = {};
    data.expenses.forEach((expense) => {
      categoryExpenses[expense.category] = (categoryExpenses[expense.category] || 0) + expense.amount;
    });
    
    const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];
    return Object.entries(categoryExpenses)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], idx) => ({
        label,
        value,
        color: colors[idx % colors.length],
      }));
  }, [data]);

  // Calculate sales by customer type
  const salesByCustomerType = useMemo(() => {
    if (!data) return [];
    const typeSales: Record<string, number> = {};
    data.invoices.filter((inv) => inv.status === "final").forEach((invoice) => {
      const customer = data.customers.find((c) => c.id === invoice.customerId);
      const customerType = customer?.customerType || "Unknown";
      typeSales[customerType] = (typeSales[customerType] || 0) + invoice.total;
    });
    
    const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
    return Object.entries(typeSales)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], idx) => ({
        label,
        value,
        color: colors[idx % colors.length],
      }));
  }, [data]);

  // Calculate total revenue and expenses
  const totalRevenue = useMemo(() => {
    if (!data) return 0;
    return data.invoices
      .filter((inv) => inv.status === "final")
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [data]);

  const totalExpenses = useMemo(() => {
    if (!data) return 0;
    return data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [data]);

  const profit = totalRevenue - totalExpenses;

  // Sales over time (revenue by month) – last N months
  const salesOverTime = useMemo(() => {
    if (!data) return [];
    const keys = getMonthKeys(CHART_MONTHS);
    const invoices = (data.invoices ?? []).filter((i) => i.status === "final");
    return keys.map((monthKey) => {
      const revenue = invoices
        .filter((inv) => inv.date.slice(0, 7) === monthKey)
        .reduce((s, inv) => s + inv.total, 0);
      return {
        month: formatMonth(monthKey),
        monthKey,
        revenue,
      };
    });
  }, [data]);

  // Profit & Loss by month – revenue, expenses, profit
  const profitLossByMonth = useMemo(() => {
    if (!data) return [];
    const keys = getMonthKeys(CHART_MONTHS);
    const invoices = (data.invoices ?? []).filter((i) => i.status === "final");
    const expenses = data.expenses ?? [];
    return keys.map((monthKey) => {
      const revenue = invoices
        .filter((inv) => inv.date.slice(0, 7) === monthKey)
        .reduce((s, inv) => s + inv.total, 0);
      const expenseTotal = expenses
        .filter((e) => e.date.slice(0, 7) === monthKey)
        .reduce((s, e) => s + e.amount, 0);
      const netProfit = revenue - expenseTotal;
      return {
        month: formatMonth(monthKey),
        monthKey,
        revenue,
        expenses: expenseTotal,
        profit: netProfit,
      };
    });
  }, [data]);

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <Skeleton className="h-10 w-10 rounded-lg mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Axpo Billing – GST-compliant billing for brick manufacturers</p>
      </div>

      {!company && (
        <Card className="mb-8 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-amber-100 border-amber-200 text-amber-600 shadow-sm">
              <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <p className="font-medium text-slate-900">Company profile not set up</p>
              <p className="text-sm mt-1 text-slate-600">
                <Link to="/setup" className="font-medium text-indigo-600 hover:text-indigo-700 no-underline">Set up company profile</Link> to start creating invoices.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => {
          const IconComponent = STAT_ICONS[stat.iconKey];
          return (
            <Link key={stat.label} to={stat.href} className="no-underline group">
              <Card className="transition-all duration-200 hover:shadow-lg group-hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${stat.iconBg} ${stat.iconColor} shadow-sm`}>
                    <IconComponent className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm mt-1 text-slate-600">{stat.label}</div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-emerald-100 border-emerald-200 text-emerald-600 shadow-sm">
              <TrendingUp className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <div className="text-sm text-slate-600">Total Revenue</div>
              <div className="text-xl font-bold text-emerald-600">₹{totalRevenue.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-rose-100 border-rose-200 text-rose-600 shadow-sm">
              <Receipt className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <div className="text-sm text-slate-600">Total Expenses</div>
              <div className="text-xl font-bold text-rose-600">₹{totalExpenses.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${profit >= 0 ? "bg-emerald-100 border-emerald-200 text-emerald-600" : "bg-rose-100 border-rose-200 text-rose-600"}`}>
              <Wallet className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <div className="text-sm text-slate-600">Net Profit</div>
              <div className={`text-xl font-bold ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                ₹{profit.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sales & Profit/Loss graphs */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Sales Over Time</h3>
          {salesOverTime.some((d) => d.revenue > 0) ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesOverTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                    tickFormatter={(v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`)}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString("en-IN")}`, "Revenue"]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.month}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
                    labelStyle={{ color: "var(--text-primary)" }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 text-sm">
              No sales data for the last {CHART_MONTHS} months
            </div>
          )}
        </Card>
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Profit & Loss by Month</h3>
          {profitLossByMonth.some((d) => d.revenue > 0 || d.expenses > 0) ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitLossByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                    tickFormatter={(v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`)}
                  />
                  <Tooltip
                    formatter={(value: number | undefined, name?: string) => [
                      `₹${(value ?? 0).toLocaleString("en-IN")}`,
                      name === "revenue" ? "Revenue" : name === "expenses" ? "Expenses" : "Net Profit",
                    ]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.month}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
                    labelStyle={{ color: "var(--text-primary)" }}
                  />
                  <Legend
                    formatter={(value) => (value === "revenue" ? "Revenue" : value === "expenses" ? "Expenses" : "Net Profit")}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" name="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="profit" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 text-sm">
              No revenue or expenses for the last {CHART_MONTHS} months
            </div>
          )}
        </Card>
      </div>

      {/* Charts section */}
      {(salesByProduct.length > 0 || expensesByCategory.length > 0) && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {salesByProduct.length > 0 && (
            <Card>
              <PieChart
                data={salesByProduct}
                title="Sales by Product"
                size={180}
              />
            </Card>
          )}
          
          {expensesByCategory.length > 0 && (
            <Card>
              <PieChart
                data={expensesByCategory}
                title="Expenses by Category"
                size={180}
              />
            </Card>
          )}

          {salesByCustomerType.length > 0 && (
            <Card>
              <PieChart
                data={salesByCustomerType}
                title="Sales by Customer Type"
                size={180}
              />
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions and Reports */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-slate-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/invoices/new" className="btn btn-primary text-center no-underline inline-flex items-center justify-center gap-2">
              <FileText className="h-4 w-4 shrink-0" strokeWidth={2} />
              New Invoice
            </Link>
            <Link to="/payments/new" className="btn btn-secondary text-center no-underline inline-flex items-center justify-center gap-2">
              <CreditCard className="h-4 w-4 shrink-0" strokeWidth={2} />
              Record Payment
            </Link>
            <Link to="/products/new" className="btn btn-secondary text-center no-underline inline-flex items-center justify-center gap-2">
              <Package className="h-4 w-4 shrink-0" strokeWidth={2} />
              Add Product
            </Link>
            <Link to="/customers/new" className="btn btn-secondary text-center no-underline inline-flex items-center justify-center gap-2">
              <Users className="h-4 w-4 shrink-0" strokeWidth={2} />
              Add Customer
            </Link>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-slate-900">Reports</h2>
          <div className="space-y-2">
            <Link to="/reports/profit" className="flex items-center gap-3 p-3 rounded-lg transition-colors no-underline bg-slate-100 text-slate-900 hover:bg-slate-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-indigo-100 border-indigo-200 text-indigo-600 shadow-sm">
                <BarChart3 className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <span>Profit & Loss</span>
            </Link>
            <Link to="/reports/sales" className="flex items-center gap-3 p-3 rounded-lg transition-colors no-underline bg-slate-100 text-slate-900 hover:bg-slate-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-emerald-100 border-emerald-200 text-emerald-600 shadow-sm">
                <TrendingUp className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <span>Sales Report</span>
            </Link>
            <Link to="/reports/outstanding" className="flex items-center gap-3 p-3 rounded-lg transition-colors no-underline bg-slate-100 text-slate-900 hover:bg-slate-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-amber-100 border-amber-200 text-amber-600 shadow-sm">
                <Wallet className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <span>Outstanding Dues</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
