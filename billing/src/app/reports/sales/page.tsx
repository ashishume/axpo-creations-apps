
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { Skeleton, TableSkeleton } from "@/components/ui";

function toCSV(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function SalesReportPage() {
  const { data, loading } = useStore();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const { rows, grandTotal, grandTax, grandAmount } = useMemo(() => {
    const invoices = (data?.invoices ?? []).filter((inv) => inv.status === "final" && inv.date >= from && inv.date <= to);
    const customers = data?.customers ?? [];
    const getCustomer = (id: string) => customers.find((c) => c.id === id);
    let total = 0;
    let tax = 0;
    let amt = 0;
    const r = invoices.map((inv) => {
      const cust = getCustomer(inv.customerId);
      total += inv.total;
      tax += inv.cgstAmount + inv.sgstAmount + inv.igstAmount;
      amt += inv.taxableAmount;
      return [inv.date, inv.number, cust?.name ?? "", inv.taxableAmount.toFixed(2), (inv.cgstAmount + inv.sgstAmount + inv.igstAmount).toFixed(2), inv.total.toFixed(2)];
    });
    return { rows: r, grandTotal: total, grandTax: tax, grandAmount: amt };
  }, [data, from, to]);

  const exportExcel = () => {
    const header = ["Date", "Invoice No", "Customer", "Amount", "Tax", "Total"];
    const csv = toCSV([header, ...rows, [], ["", "", "Total", grandAmount.toFixed(2), grandTax.toFixed(2), grandTotal.toFixed(2)]]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1>Sales Report</h1>
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
        <button
          type="button"
          onClick={exportExcel}
          className="btn btn-primary px-3 py-1.5"
        >
          Export CSV
        </button>
      </div>
      <div className="table-container mt-6">
        <table className="table">
          <thead>
            <tr className="border-b-2" style={{ borderColor: "var(--border)" }}>
              <th>Date</th>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Tax</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4" style={{ color: "var(--text-secondary)" }}>
                  No invoices in this range.
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
        <p className="mt-4 font-bold">
          Grand Total: {grandTotal.toFixed(2)} (Tax: {grandTax.toFixed(2)})
        </p>
      )}
    </div>
  );
}
