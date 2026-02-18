
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { Skeleton, TableSkeleton } from "@/components/ui";

/**
 * Yearly transaction summary for tax filing (GSTR-9 reference).
 * Financial year: April (year) to March (year+1).
 */
export function YearlyReportPage() {
  const { data, loading } = useStore();
  const company = data?.company ?? null;
  const currentFY = company?.financialYearStart ?? (new Date().getMonth() >= 2 ? new Date().getFullYear() : new Date().getFullYear() - 1);
  const [fyStart, setFyStart] = useState(currentFY);

  const { from, to, summary } = useMemo(() => {
    const start = fyStart;
    const end = fyStart + 1;
    const from = `${start}-04-01`;
    const to = `${end}-03-31`;
    const invs = (data?.invoices ?? []).filter(
      (i) => i.status === "final" && i.date >= from && i.date <= to
    );
    const pays = (data?.payments ?? []).filter((p) => p.date >= from && p.date <= to);
    const totalTaxable = invs.reduce((s, i) => s + i.taxableAmount, 0);
    const totalCgst = invs.reduce((s, i) => s + i.cgstAmount, 0);
    const totalSgst = invs.reduce((s, i) => s + i.sgstAmount, 0);
    const totalIgst = invs.reduce((s, i) => s + i.igstAmount, 0);
    const totalSales = invs.reduce((s, i) => s + i.total, 0);
    const totalReceived = pays.reduce((s, p) => s + p.amount, 0);
    return {
      from,
      to,
      summary: {
        invoiceCount: invs.length,
        totalTaxable,
        totalCgst,
        totalSgst,
        totalIgst,
        totalGst: totalCgst + totalSgst + totalIgst,
        totalSales,
        totalReceived,
      },
    };
  }, [data, fyStart]);

  const fyOptions = [];
  for (let y = currentFY - 5; y <= currentFY + 1; y++) {
    fyOptions.push(y);
  }

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <TableSkeleton rows={9} cols={2} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Yearly Summary (Tax Filing)
      </h1>
      <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
        Use this for annual GST return (GSTR-9) reference. All figures are for the selected financial year (April–March).
      </p>
      <p className="mt-2">
        <Link to="/reports">Back to reports</Link>
      </p>
      <div className="mt-4">
        <label className="mr-2" style={{ color: "var(--text-primary)" }}>Financial year</label>
        <select
          value={fyStart}
          onChange={(e) => setFyStart(Number(e.target.value))}
          className="px-2 py-1.5 rounded-md border transition-colors"
          style={{
            background: "var(--input-bg)",
            color: "var(--text-primary)",
            borderColor: "var(--input-border)",
          }}
        >
          {fyOptions.map((y) => (
            <option key={y} value={y}>
              {y}-{String(y + 1).slice(-2)} (Apr {y} – Mar {y + 1})
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-sm" style={{ color: "var(--text-primary)" }}>
        Period: <strong>{from}</strong> to <strong>{to}</strong>
      </p>

      <div className="table-container mt-6 max-w-[420px]">
        <table className="table">
          <tbody>
            <tr>
              <td className="pl-0 pr-4 py-2" style={{ color: "var(--text-primary)" }}>Number of invoices</td>
              <td className="py-2 text-right" style={{ color: "var(--text-primary)" }}>{summary.invoiceCount}</td>
            </tr>
            <tr>
              <td className="pl-0 pr-4 py-2" style={{ color: "var(--text-primary)" }}>Total taxable value</td>
              <td className="py-2 text-right" style={{ color: "var(--text-primary)" }}>₹ {summary.totalTaxable.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="pl-0 pr-4 py-2" style={{ color: "var(--text-primary)" }}>Total CGST</td>
              <td className="py-2 text-right" style={{ color: "var(--text-primary)" }}>₹ {summary.totalCgst.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="pl-0 pr-4 py-2" style={{ color: "var(--text-primary)" }}>Total SGST</td>
              <td className="py-2 text-right" style={{ color: "var(--text-primary)" }}>₹ {summary.totalSgst.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="pl-0 pr-4 py-2" style={{ color: "var(--text-primary)" }}>Total IGST</td>
              <td className="py-2 text-right" style={{ color: "var(--text-primary)" }}>₹ {summary.totalIgst.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="pl-0 pr-4 py-2" style={{ color: "var(--text-primary)" }}>Total GST (CGST+SGST+IGST)</td>
              <td className="py-2 text-right" style={{ color: "var(--text-primary)" }}>₹ {summary.totalGst.toFixed(2)}</td>
            </tr>
            <tr className="[&>td]:border-b-2 [&>td]:border-(--border-strong)">
              <td className="pl-0 pr-4 py-2 font-bold" style={{ color: "var(--text-primary)" }}>Total sales (invoice value)</td>
              <td className="py-2 text-right font-bold" style={{ color: "var(--text-primary)" }}>₹ {summary.totalSales.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="pl-0 pr-4 py-2" style={{ color: "var(--text-primary)" }}>Total payments received</td>
              <td className="py-2 text-right" style={{ color: "var(--text-primary)" }}>₹ {summary.totalReceived.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        className="mt-6 p-3 max-w-[520px]"
        style={{
          background: "var(--table-row-alt)",
          color: "var(--text-primary)",
        }}
      >
        <strong>For tax filing (GSTR-9):</strong>
        <ul className="mt-2 ml-4 list-disc pl-2">
          <li><strong>Outward taxable supplies</strong> (4.1): use Total taxable value above.</li>
          <li><strong>Tax on outward supplies</strong> (4.2): use Total GST (CGST/SGST/IGST as per your return tables).</li>
          <li>Reconcile with your monthly GSTR-1 and books; this report is a reference only.</li>
        </ul>
      </div>
    </div>
  );
}
