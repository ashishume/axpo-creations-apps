
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { Skeleton, TableSkeleton } from "@/components/ui";

export function OutstandingReportPage() {
  const { data, loading } = useStore();
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);

  const rows = useMemo(() => {
    const customers = data?.customers ?? [];
    const invoices = (data?.invoices ?? []).filter((i) => i.status === "final");
    const payments = data?.payments ?? [];
    return customers.map((c) => {
      const custInvoices = invoices.filter((i) => i.customerId === c.id);
      const totalInvoiced = custInvoices.reduce((s, i) => s + i.total, 0);
      const totalPaid = payments.filter((p) => p.customerId === c.id).reduce((s, p) => s + p.amount, 0);
      const balance = totalInvoiced - totalPaid + (c.openingBalance || 0);
      return { customer: c, totalInvoiced, totalPaid, balance };
    }).filter((r) => !onlyWithBalance || r.balance > 0);
  }, [data, onlyWithBalance]);

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
      <h1 className="text-[var(--text-primary)]">Customer Outstanding</h1>
      <p className="mt-2">
        <Link to="/reports">Back to reports</Link>
      </p>
      <div className="mt-4">
        <label className="flex items-center gap-2 cursor-pointer text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={onlyWithBalance}
            onChange={(e) => setOnlyWithBalance(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
            style={{ accentColor: "var(--btn-primary-bg)" }}
          />
          Only customers with balance &gt; 0
        </label>
      </div>
      <div className="table-container mt-6">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Total Invoices</th>
              <th>Total Paid</th>
              <th>Balance Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.customer.id}>
                <td>{r.customer.name}</td>
                <td>{r.totalInvoiced.toFixed(2)}</td>
                <td>{r.totalPaid.toFixed(2)}</td>
                <td>{r.balance.toFixed(2)}</td>
                <td>
                  <Link to={`/reports/ledger?customerId=${r.customer.id}`}>Ledger</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
