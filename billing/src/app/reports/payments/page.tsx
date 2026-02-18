
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { Skeleton, TableSkeleton } from "@/components/ui";

export function PaymentReportPage() {
  const { data, loading } = useStore();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const { rows, total } = useMemo(() => {
    const list = (data?.payments ?? []).filter((p) => p.date >= from && p.date <= to);
    const customers = data?.customers ?? [];
    const getCustomer = (id: string) => customers.find((c) => c.id === id);
    const t = list.reduce((s, p) => s + p.amount, 0);
    const r = list.map((p) => {
      const cust = getCustomer(p.customerId);
      return [p.date, p.receiptNo, cust?.name ?? "", p.amount.toFixed(2), p.mode];
    });
    return { rows: r, total: t };
  }, [data, from, to]);

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
      <h1>Payment Report</h1>
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
            className="input w-auto"
          />
        </label>
        <label>
          To{" "}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input w-auto"
          />
        </label>
      </div>
      <div className="table-container mt-6">
        <table className="table">
          <thead>
            <tr className="border-b-2" style={{ borderColor: "var(--border)" }}>
              <th>Date</th>
              <th>Receipt No</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Mode</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4" style={{ color: "var(--text-secondary)" }}>
                  No payments in this range.
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <p className="mt-4 font-bold">Total received: {total.toFixed(2)}</p>
      )}
    </div>
  );
}
