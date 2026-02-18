
import { useState, useMemo, Suspense } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { Skeleton, TableSkeleton } from "@/components/ui";

export function LedgerReportPage() {
  return (
    <div>
      <h1>Customer Ledger</h1>
      <p style={{ marginTop: "0.5rem" }}>
        <Link to="/reports">Back to reports</Link>
      </p>
      <Suspense fallback={null}>
        <LedgerContent />
      </Suspense>
    </div>
  );
}

function LedgerContent() {
  const { data, loading } = useStore();
  const [customerId, setCustomerId] = useState("");
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const customers = data?.customers ?? [];
  const customer = customerId ? customers.find((c) => c.id === customerId) ?? null : null;

  const { entries, outstanding, lastPayment, lastInvoice } = useMemo(() => {
    if (!customerId) return { entries: [], outstanding: 0, lastPayment: "", lastInvoice: "" };
    const invoices = (data?.invoices ?? []).filter((i) => i.customerId === customerId && i.status === "final");
    const payments = (data?.payments ?? []).filter((p) => p.customerId === customerId);
    const opening = customer?.openingBalance ?? 0;
    interface LedgerRow {
      date: string;
      desc: string;
      debit: number;
      credit: number;
      balance: number;
    }
    const entries: LedgerRow[] = [];
    if (opening !== 0) {
      entries.push({ date: "", desc: "Balance brought forward", debit: opening > 0 ? opening : 0, credit: opening < 0 ? Math.abs(opening) : 0, balance: 0 });
    }
    invoices.forEach((i) => {
      entries.push({ date: i.date, desc: `Invoice ${i.number}`, debit: i.total, credit: 0, balance: 0 });
    });
    payments.forEach((p) => {
      entries.push({ date: p.date, desc: `Payment ${p.receiptNo} (${p.mode})`, debit: 0, credit: p.amount, balance: 0 });
    });
    entries.sort((a, b) => (a.date || "0").localeCompare(b.date || "0"));
    let balance = opening;
    entries.forEach((e) => {
      balance += e.debit - e.credit;
      e.balance = balance;
    });
    const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const lastInv = invoices.sort((a, b) => b.date.localeCompare(a.date))[0];
    const lastPay = payments.sort((a, b) => b.date.localeCompare(a.date))[0];
    return {
      entries,
      outstanding: opening + totalInvoiced - totalPaid,
      lastPayment: lastPay?.date ?? "",
      lastInvoice: lastInv?.date ?? "",
    };
  }, [customerId, customer?.openingBalance, data]);

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <>
      <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Customer</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={{ padding: 6, minWidth: 220 }}
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} – {c.phone}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: 6 }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: 6 }} />
        </div>
      </div>
      {customerId && (
        <>
          <p style={{ marginTop: "1rem" }}>
            <strong>Outstanding:</strong> {outstanding.toFixed(2)}
            {lastInvoice && ` | Last invoice: ${lastInvoice}`}
            {lastPayment && ` | Last payment: ${lastPayment}`}
          </p>
          <table style={{ marginTop: "1rem", width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Date</th>
                <th style={{ padding: 8 }}>Particulars</th>
                <th style={{ padding: 8 }}>Debit</th>
                <th style={{ padding: 8 }}>Credit</th>
                <th style={{ padding: 8 }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {entries
                .filter((e) => !from || e.date >= from)
                .filter((e) => !to || e.date <= to)
                .map((e, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 8 }}>{e.date}</td>
                    <td style={{ padding: 8 }}>{e.desc}</td>
                    <td style={{ padding: 8 }}>{e.debit ? e.debit.toFixed(2) : ""}</td>
                    <td style={{ padding: 8 }}>{e.credit ? e.credit.toFixed(2) : ""}</td>
                    <td style={{ padding: 8 }}>{e.balance.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="no-print" style={{ marginTop: "1rem" }}>
            <button type="button" onClick={() => window.print()} style={{ padding: "8px 16px" }}>Print statement</button>
          </div>
        </>
      )}
    </>
  );
}
