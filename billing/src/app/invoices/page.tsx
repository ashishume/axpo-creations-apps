
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useInvoices, useCustomers } from "@/hooks/useStore";
import { Card, ViewIcon, PrintIcon, PlusIcon, TableSkeleton } from "@/components/ui";
import type { InvoiceStatus } from "@/lib/db/types";

export function InvoicesPage() {
  const { data: invoicesData, loading: invoicesLoading } = useInvoices();
  const { data: customersData, loading: customersLoading } = useCustomers();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");

  const loading = invoicesLoading || customersLoading;

  const invoices = useMemo(() => {
    const list = invoicesData ?? [];
    let filtered = list;
    if (dateFrom) filtered = filtered.filter((inv) => inv.date >= dateFrom);
    if (dateTo) filtered = filtered.filter((inv) => inv.date <= dateTo);
    if (statusFilter) filtered = filtered.filter((inv) => inv.status === statusFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      const customers = customersData ?? [];
      filtered = filtered.filter((inv) => {
        const cust = customers.find((c) => c.id === inv.customerId);
        return (
          inv.number.toLowerCase().includes(s) ||
          (cust?.name ?? "").toLowerCase().includes(s)
        );
      });
    }
    return filtered.sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [invoicesData, customersData, search, dateFrom, dateTo, statusFilter]);

  const customerMap = useMemo(() => {
    const customers = customersData ?? [];
    return new Map(customers.map((c) => [c.id, c]));
  }, [customersData]);

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Invoices
        </h1>
        <div className="mt-6">
          <TableSkeleton rows={8} cols={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Invoices
      </h1>
      <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center">
        <input
          type="text"
          placeholder="Search by invoice no or customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full sm:w-52 min-w-0"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter((e.target.value || "") as InvoiceStatus | "")}
          className="input w-full sm:w-32 min-w-0"
          style={{ color: "var(--text-primary)" }}
        >
          <option value="">All status</option>
          <option value="draft">Draft</option>
          <option value="final">Final</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label className="flex items-center gap-2 text-sm shrink-0" style={{ color: "var(--text-primary)" }}>
          From
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-auto min-w-0 px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm shrink-0" style={{ color: "var(--text-primary)" }}>
          To
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-auto min-w-0 px-3 py-2" />
        </label>
        <Link to="/invoices/new" className="btn btn-primary no-underline w-full sm:w-auto shrink-0">
          <PlusIcon size={16} />
          New Invoice
        </Link>
      </div>
      <Card padding="none" className="mt-6 overflow-hidden">
        <div className="table-container border-0 -mx-4 sm:mx-0">
          <table className="table min-w-[560px]">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center" style={{ color: "var(--text-secondary)" }}>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-base">No invoices found</span>
                      <Link to="/invoices/new" className="text-indigo-600 hover:text-indigo-700 font-medium no-underline">
                        Create your first invoice
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
              {invoices.map((inv) => {
                const cust = customerMap.get(inv.customerId);
                const formattedDate = new Date(inv.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                return (
                  <tr key={inv.id}>
                    <td>
                      <span className="font-semibold text-slate-800">{inv.number}</span>
                    </td>
                    <td>
                      <span className="text-slate-600">{formattedDate}</span>
                    </td>
                    <td>
                      <span className="font-medium text-slate-700">{cust?.name ?? "—"}</span>
                    </td>
                    <td className="text-right">
                      <span className="font-semibold text-slate-800 tabular-nums">
                        ₹{inv.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          inv.status === "final"
                            ? "bg-emerald-100 text-emerald-700"
                            : inv.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors no-underline touch-manipulation"
                          title="View invoice"
                        >
                          <ViewIcon size={18} className="text-slate-500 hover:text-indigo-600" />
                        </Link>
                        {inv.status === "final" && (
                          <Link
                            to={`/invoices/${inv.id}/print`}
                            className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors no-underline touch-manipulation"
                            title="Print invoice"
                          >
                            <PrintIcon size={18} className="text-slate-500 hover:text-emerald-600" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
