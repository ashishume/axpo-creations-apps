
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePayments, useCustomers } from "@/hooks/useStore";
import { Card, PrintIcon, PlusIcon, Skeleton, TableSkeleton } from "@/components/ui";
import { NewPaymentModal } from "@/components/modals/NewPaymentModal";

export function PaymentsPage() {
  const { data: paymentsData, loading, refetch } = usePayments();
  const { data: customersData } = useCustomers();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modeFilter, setModeFilter] = useState<"cash" | "cheque" | "online" | "">("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const payments = useMemo(() => {
    let list = (paymentsData ?? []).sort((a, b) => (b.date > a.date ? 1 : -1));
    if (dateFrom) list = list.filter((p) => p.date >= dateFrom);
    if (dateTo) list = list.filter((p) => p.date <= dateTo);
    if (modeFilter) list = list.filter((p) => p.mode === modeFilter);
    return list;
  }, [paymentsData, dateFrom, dateTo, modeFilter]);
  const customers = customersData ?? [];
  const getCustomer = (id: string) => customers.find((c) => c.id === id);

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="mt-4">
          <Skeleton className="h-10 w-32" />
        </div>
        <Card padding="none" className="mt-6 overflow-hidden">
          <TableSkeleton rows={8} cols={6} />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Payments
      </h1>
      <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center">
        <label className="flex items-center gap-2 text-sm shrink-0" style={{ color: "var(--text-primary)" }}>
          From
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-auto min-w-0 px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm shrink-0" style={{ color: "var(--text-primary)" }}>
          To
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-auto min-w-0 px-3 py-2" />
        </label>
        <select
          value={modeFilter}
          onChange={(e) => setModeFilter((e.target.value || "") as "cash" | "cheque" | "online" | "")}
          className="input w-full sm:w-36 min-w-0"
          style={{ color: "var(--text-primary)" }}
        >
          <option value="">All modes</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
          <option value="online">Online</option>
        </select>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="btn btn-primary w-full sm:w-auto shrink-0"
        >
          <PlusIcon size={16} />
          New Payment
        </button>
      </div>
      <NewPaymentModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSaved={() => refetch()} />
      <Card padding="none" className="mt-6 overflow-hidden">
        <div className="table-container border-0 -mx-4 sm:mx-0">
          <table className="table min-w-[520px]">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    No payments.{" "}
                    <button type="button" onClick={() => setAddModalOpen(true)} className="text-indigo-600 hover:underline bg-transparent border-none cursor-pointer p-0">
                      Record one
                    </button>
                    .
                  </td>
                </tr>
              )}
              {payments.map((p) => {
                const cust = getCustomer(p.customerId);
                return (
                  <tr key={p.id} className="transition-colors duration-200">
                    <td>{p.receiptNo}</td>
                    <td>{p.date}</td>
                    <td>{cust?.name ?? p.customerId}</td>
                    <td>₹{p.amount.toFixed(2)}</td>
                    <td>{p.mode}</td>
                    <td>
                      <Link
                        to={`/payments/${p.id}/print`}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors no-underline inline-flex touch-manipulation"
                        title="Print receipt"
                      >
                        <PrintIcon size={16} className="text-green-600 dark:text-green-400" />
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
