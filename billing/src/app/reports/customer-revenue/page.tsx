
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { Skeleton, TableSkeleton } from "@/components/ui";

export function CustomerRevenueReportPage() {
  const { data, loading } = useStore();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const rows = useMemo(() => {
    const customers = data?.customers ?? [];
    const invs = (data?.invoices ?? []).filter((i) => i.status === "final" && i.date >= from && i.date <= to);
    const items = data?.invoiceItems ?? [];
    return customers.map((c) => {
      const customerInvs = invs.filter((i) => i.customerId === c.id);
      const totalRevenue = customerInvs.reduce((s, i) => s + i.total, 0);
      let totalPieces = 0;
      customerInvs.forEach((inv) => {
        items.filter((it) => it.invoiceId === inv.id).forEach((it) => {
          totalPieces += it.quantity;
        });
      });
      return {
        customer: c,
        invoiceCount: customerInvs.length,
        totalPieces,
        totalRevenue,
      };
    }).filter((r) => r.invoiceCount > 0).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [data, from, to]);

  const grandRevenue = useMemo(() => rows.reduce((s, r) => s + r.totalRevenue, 0), [rows]);
  const grandPieces = useMemo(() => rows.reduce((s, r) => s + r.totalPieces, 0), [rows]);

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1>Revenue by Customer</h1>
      <p className="mt-2 text-[var(--text-secondary)]">
        Yearly (or any period) revenue from actual sales. When a customer buys bricks, you create an invoice; this report shows how much each customer bought and the total revenue.
      </p>
      <p className="mt-2">
        <Link to="/reports">Back to reports</Link>
      </p>
      <div className="mt-4 flex gap-4 items-center flex-wrap">
        <label>
          From{" "}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </label>
        <label>
          To{" "}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
        </label>
      </div>
      <p className="mt-2 text-sm">
        Showing customers who had at least one invoice in this period.
      </p>
      <div className="table-container mt-6">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Type</th>
              <th>Invoices</th>
              <th>Quantity (pieces)</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-[var(--text-secondary)]">
                  No sales in this period. Create invoices to see customer revenue here.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.customer.id}>
                <td>{r.customer.name}</td>
                <td>{r.customer.customerType}</td>
                <td>{r.invoiceCount}</td>
                <td>{r.totalPieces.toLocaleString()}</td>
                <td>₹ {r.totalRevenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <p className="mt-4 font-bold">
          Total quantity: {grandPieces.toLocaleString()} pieces &nbsp;|&nbsp; Total revenue: ₹ {grandRevenue.toFixed(2)}
        </p>
      )}
    </div>
  );
}
