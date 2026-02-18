
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { Skeleton, TableSkeleton } from "@/components/ui";

export function ProfitReportPage() {
  const { data, loading } = useStore();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const summary = useMemo(() => {
    const invs = (data?.invoices ?? []).filter((i) => i.status === "final" && i.date >= from && i.date <= to);
    const items = data?.invoiceItems ?? [];
    let revenue = 0;
    let cogs = 0;
    invs.forEach((inv) => {
      revenue += inv.total;
      items.filter((it) => it.invoiceId === inv.id).forEach((it) => {
        cogs += (it.costPrice ?? 0) * it.quantity;
      });
    });
    const grossProfit = revenue - cogs;
    const expenses = (data?.expenses ?? [])
      .filter((e) => e.date >= from && e.date <= to)
      .reduce((s, e) => s + e.amount, 0);
    const netProfit = grossProfit - expenses;
    return {
      revenue,
      cogs,
      grossProfit,
      expenses,
      netProfit,
      grossMarginPct: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      netMarginPct: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    };
  }, [data, from, to]);

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <TableSkeleton rows={8} cols={2} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1>Profit &amp; Loss</h1>
      <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
        See how much you earned (sales), what it cost to make the goods sold, and what&apos;s left after expenses. Pick a date range.
      </p>
      <p className="mt-2">
        <Link to="/reports">Back to reports</Link>
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label>
          From{" "}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="p-1.5"
          />
        </label>
        <label>
          To{" "}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="p-1.5"
          />
        </label>
      </div>

      <div className="table-container mt-6 max-w-[440px]">
        <table className="table">
          <tbody>
            <tr>
              <td className="pr-4"><strong>Revenue (sales)</strong></td>
              <td className="text-right">₹ {summary.revenue.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="pr-4">Cost of goods</td>
              <td className="text-right">₹ {summary.cogs.toFixed(2)}</td>
            </tr>
            <tr className="[&>td]:border-b-2 [&>td]:border-b-(--border-strong)">
              <td className="pr-4"><strong>Gross profit</strong></td>
              <td className="text-right">₹ {summary.grossProfit.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="pr-4 text-sm">Gross margin</td>
              <td className="text-right text-sm">{summary.grossMarginPct.toFixed(1)}%</td>
            </tr>
            <tr>
              <td className="pr-4">Expenses</td>
              <td className="text-right">₹ {summary.expenses.toFixed(2)}</td>
            </tr>
            <tr className="[&>td]:border-b-2 [&>td]:border-b-(--border-strong)">
              <td className="pr-4"><strong>Net profit</strong></td>
              <td
                className="text-right"
                style={{
                  color: summary.netProfit >= 0 ? "var(--success)" : "var(--btn-danger)",
                }}
              >
                ₹ {summary.netProfit.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="pr-4 text-sm">Net margin</td>
              <td className="text-right text-sm">{summary.netMarginPct.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        className="mt-6 max-w-[520px] p-3 text-sm"
        style={{ background: "var(--table-row-alt)" }}
      >
        <strong>What this means</strong>
        <ul className="ml-4 mt-2 list-disc pl-2">
          <li><strong>Revenue</strong> = Total sales (invoice amounts) in this period.</li>
          <li><strong>Cost of goods</strong> = Cost of the products you sold (using cost price set in Products).</li>
          <li><strong>Gross profit</strong> = Revenue minus cost of goods. How much you made from sales before other expenses.</li>
          <li><strong>Expenses</strong> = All expenses you entered (Expenses menu) in this period.</li>
          <li><strong>Net profit</strong> = Gross profit minus expenses. Your actual profit for the period.</li>
        </ul>
      </div>
    </div>
  );
}
