
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePurchaseInvoices, useSuppliers } from "@/hooks/useStore";
import { Card, ViewIcon, PlusIcon, Skeleton, TableSkeleton } from "@/components/ui";

export function PurchaseInvoicesPage() {
  const { data: purchaseInvoicesData, loading: piLoading } = usePurchaseInvoices();
  const { data: suppliersData, loading: suppliersLoading } = useSuppliers();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loading = piLoading || suppliersLoading;

  const purchaseInvoices = useMemo(() => {
    const list = purchaseInvoicesData ?? [];
    let filtered = list;
    if (dateFrom) filtered = filtered.filter((pi) => pi.date >= dateFrom);
    if (dateTo) filtered = filtered.filter((pi) => pi.date <= dateTo);
    if (search.trim()) {
      const s = search.toLowerCase();
      const suppliers = suppliersData ?? [];
      filtered = filtered.filter((pi) => {
        const sup = suppliers.find((x) => x.id === pi.supplierId);
        return (
          pi.number.toLowerCase().includes(s) ||
          (sup?.name ?? "").toLowerCase().includes(s)
        );
      });
    }
    return filtered.sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [purchaseInvoicesData, suppliersData, search, dateFrom, dateTo]);

  const supplierMap = useMemo(() => {
    const suppliers = suppliersData ?? [];
    return new Map(suppliers.map((s) => [s.id, s]));
  }, [suppliersData]);

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="mt-6">
          <TableSkeleton rows={8} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Purchase Invoices
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Record purchases from suppliers. Stock is added automatically when you save.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center">
        <input
          type="text"
          placeholder="Search by number or supplier"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full sm:w-52 min-w-0"
        />
        <label className="flex items-center gap-2 text-sm shrink-0" style={{ color: "var(--text-primary)" }}>
          From
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-auto min-w-0 px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm shrink-0" style={{ color: "var(--text-primary)" }}>
          To
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-auto min-w-0 px-3 py-2" />
        </label>
        <Link to="/purchase-invoices/new" className="btn btn-primary no-underline w-full sm:w-auto shrink-0">
          <PlusIcon size={16} />
          New Purchase
        </Link>
      </div>
      <Card padding="none" className="mt-6 overflow-hidden">
        <div className="table-container border-0 -mx-4 sm:mx-0">
          <table className="table min-w-[480px]">
            <thead>
              <tr>
                <th>Number</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center" style={{ color: "var(--text-secondary)" }}>
                    No purchase invoices.{" "}
                    <Link to="/purchase-invoices/new" className="no-underline">
                      Create one
                    </Link>
                    .
                  </td>
                </tr>
              )}
              {purchaseInvoices.map((pi) => {
                const sup = supplierMap.get(pi.supplierId);
                return (
                  <tr key={pi.id} className="transition-colors duration-200">
                    <td>{pi.number}</td>
                    <td>{pi.date}</td>
                    <td>{(sup?.name ?? pi.supplierId) || "—"}</td>
                    <td>₹{pi.total.toFixed(2)}</td>
                    <td>
                      <Link
                        to={`/purchase-invoices/${pi.id}`}
                        className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors no-underline touch-manipulation"
                        title="View purchase invoice"
                      >
                        <ViewIcon size={16} className="text-blue-600 dark:text-blue-400" />
                      </Link>
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
