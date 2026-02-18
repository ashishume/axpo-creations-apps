
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "@/hooks/useStore";
import { deleteExpenseAsync } from "@/lib/store-async";
import { Card, EditIcon, DeleteIcon, PlusIcon, Skeleton, TableSkeleton } from "@/components/ui";
import { AddExpenseModal } from "@/components/modals/AddExpenseModal";
import type { ExpenseCategory } from "@/lib/db/types";

const CATEGORIES: ExpenseCategory[] = [
  "Labour",
  "Raw material",
  "Fuel",
  "Electricity",
  "Maintenance",
  "Rent",
  "Other",
];

export function ExpensesPage() {
  const { data: expensesData, loading, refetch } = useExpenses();
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const expenses = useMemo(() => {
    let list = (expensesData ?? []).sort((a, b) => (b.date > a.date ? 1 : -1));
    if (categoryFilter) list = list.filter((e) => e.category === categoryFilter);
    if (dateFrom) list = list.filter((e) => e.date >= dateFrom);
    if (dateTo) list = list.filter((e) => e.date <= dateTo);
    return list;
  }, [expensesData, categoryFilter, dateFrom, dateTo]);

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const result = await deleteExpenseAsync(id);
    if (result.ok) {
      refetch();
    } else {
      alert(result.error);
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card padding="none" className="mt-6 overflow-hidden">
          <TableSkeleton rows={5} cols={5} />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Expenses
      </h1>
      <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
        Record factory costs (labour, fuel, electricity, etc.). Used in Profit &amp; Loss report.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter((e.target.value || "") as ExpenseCategory | "")}
          className="input w-full sm:w-44 min-w-0"
          style={{ color: "var(--text-primary)" }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm shrink-0" style={{ color: "var(--text-primary)" }}>
          From
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-auto min-w-0 px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm shrink-0" style={{ color: "var(--text-primary)" }}>
          To
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-auto min-w-0 px-3 py-2" />
        </label>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="btn btn-primary w-full sm:w-auto shrink-0"
        >
          <PlusIcon size={16} />
          Add Expense
        </button>
      </div>
      <AddExpenseModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSaved={() => refetch()} />
      <Card padding="none" className="mt-6 overflow-hidden">
        <div className="table-container border-0 -mx-4 sm:mx-0">
          <table className="table min-w-[520px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center" style={{ color: "var(--text-secondary)" }}>
                    No expenses.{" "}
                    <button type="button" onClick={() => setAddModalOpen(true)} className="text-indigo-600 hover:underline bg-transparent border-none cursor-pointer p-0">
                      Add one
                    </button>
                    .
                  </td>
                </tr>
              )}
              {expenses.map((e) => (
                <tr key={e.id} className="transition-colors duration-200">
                  <td>{e.date}</td>
                  <td>{e.category}</td>
                  <td>₹{e.amount.toFixed(2)}</td>
                  <td>{e.description || "—"}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/expenses/${e.id}/edit`}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors no-underline touch-manipulation"
                        title="Edit expense"
                      >
                        <EditIcon size={16} className="text-blue-600 dark:text-blue-400" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(e.id)}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors bg-transparent border-none cursor-pointer touch-manipulation"
                        title="Delete expense"
                      >
                        <DeleteIcon size={16} style={{ color: "var(--btn-danger)" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {expenses.length > 0 && (
        <p className="mt-4 font-bold" style={{ color: "var(--text-primary)" }}>
          Total (filtered): ₹{total.toFixed(2)}
        </p>
      )}
    </div>
  );
}
