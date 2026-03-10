import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useExpensesBySessionInfinite, useCreateExpense, useUpdateExpense, useDeleteExpense } from "../hooks/useExpenses";
import { useFixedCostsBySession, useCreateFixedCost, useUpdateFixedCost, useDeleteFixedCost } from "../hooks/useFixedCosts";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { FilterChips } from "../components/ui/FilterChips";
import { SearchInput } from "../components/ui/SearchInput";
import { Skeleton, SkeletonTable } from "../components/ui/Skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Expense as ExpenseType, ExpenseCategory, PaymentMethod, FixedMonthlyCost } from "../types";
import { formatCurrency, formatDate } from "../lib/utils";

const categories: ExpenseCategory[] = [
  "Transportation",
  "Events",
  "Utilities",
  "Supplies",
  "Infrastructure",
  "Miscellaneous",
];

const fixedCostCategories: ExpenseCategory[] = [
  "Utilities",
  "Infrastructure",
  "Miscellaneous",
];

export function ExpensesPage() {
  const { selectedSessionId, toast } = useApp();

  const {
    expenses,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: expLoading,
  } = useExpensesBySessionInfinite(selectedSessionId ?? "");
  const { data: fixedCosts = [], isLoading: fcLoading } = useFixedCostsBySession(selectedSessionId ?? "");
  const isAppLoading = expLoading || fcLoading;

  const createExpense = useCreateExpense();
  const updateExpenseMut = useUpdateExpense();
  const deleteExpenseMut = useDeleteExpense();
  const createFixedCost = useCreateFixedCost();
  const updateFixedCostMut = useUpdateFixedCost();
  const deleteFixedCostMut = useDeleteFixedCost();

  const addExpense = (data: Omit<ExpenseType, "id">) => createExpense.mutate(data);
  const updateExpense = (id: string, data: Partial<ExpenseType>) => updateExpenseMut.mutate({ id, updates: data });
  const deleteExpense = (id: string) => deleteExpenseMut.mutate(id);
  const addFixedCost = (data: Omit<FixedMonthlyCost, "id">) => createFixedCost.mutate(data);
  const updateFixedCost = (id: string, data: Partial<FixedMonthlyCost>) => updateFixedCostMut.mutate({ id, updates: data });
  const deleteFixedCost = (id: string) => deleteFixedCostMut.mutate(id);
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; expense?: ExpenseType }>({ open: false });
  const [fixedCostModal, setFixedCostModal] = useState<{ open: boolean; cost?: FixedMonthlyCost }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; desc: string; type: "expense" | "fixedCost" } | null>(null);
  const [filterCat, setFilterCat] = useState<ExpenseCategory | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const list = useMemo(() => {
    let items = [...expenses];
    if (filterCat) items = items.filter((e) => e.category === filterCat);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          (e.vendorPayee && e.vendorPayee.toLowerCase().includes(q))
      );
    }
    if (dateFrom) items = items.filter((e) => e.date >= dateFrom);
    if (dateTo) items = items.filter((e) => e.date <= dateTo);
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filterCat, searchQuery, dateFrom, dateTo]);

  const total = useMemo(() => list.reduce((s, e) => s + e.amount, 0), [list]);

  const sessionFixedCosts = fixedCosts;

  const totalFixedMonthly = useMemo(
    () => sessionFixedCosts.filter(fc => fc.isActive).reduce((s, fc) => s + fc.amount, 0),
    [sessionFixedCosts]
  );

  const handleSaveExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value);
    const category = (form.elements.namedItem("category") as HTMLSelectElement).value as ExpenseCategory;
    const description = (form.elements.namedItem("description") as HTMLInputElement).value.trim();
    const vendorPayee = (form.elements.namedItem("vendorPayee") as HTMLInputElement).value.trim();
    const paymentMethod = (form.elements.namedItem("paymentMethod") as HTMLSelectElement).value as PaymentMethod;
    if (!selectedSessionId || !date || amount <= 0) return;
    if (expenseModal.expense) {
      updateExpense(expenseModal.expense.id, {
        date,
        amount,
        category,
        description,
        vendorPayee,
        paymentMethod,
      });
      toast("Expense updated");
    } else {
      addExpense({
        sessionId: selectedSessionId,
        date,
        amount,
        category,
        description,
        vendorPayee,
        paymentMethod,
      });
      toast("Expense added");
    }
    setExpenseModal({ open: false });
  };

  const handleSaveFixedCost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSessionId) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value);
    const category = (form.elements.namedItem("category") as HTMLSelectElement).value as ExpenseCategory;
    const isActive = (form.elements.namedItem("isActive") as HTMLInputElement).checked;

    if (!name || amount <= 0) return;

    if (fixedCostModal.cost) {
      updateFixedCost(fixedCostModal.cost.id, { name, amount, category, isActive });
      toast("Fixed cost updated");
    } else {
      addFixedCost({ sessionId: selectedSessionId, name, amount, category, isActive });
      toast("Fixed cost added");
    }
    setFixedCostModal({ open: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Expenses</h2>
          <p className="text-slate-600 dark:text-slate-400">Track expenses by category</p>
        </div>
        <Button
          size="sm"
          disabled={!selectedSessionId}
          onClick={() => setExpenseModal({ open: true })}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add expense
        </Button>
      </div>

      {selectedSessionId && (
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search description or vendor..."
            className="max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Category:</span>
            <FilterChips
              options={[
                { value: "", label: "All" },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
              value={filterCat}
              onChange={(v) => setFilterCat(v as ExpenseCategory | "")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-slate-500 dark:text-slate-400">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
            <label className="text-sm text-slate-500 dark:text-slate-400">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      )}

      {!selectedSessionId ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400">
            Select a school and session to view expenses.
          </CardContent>
        </Card>
      ) : isAppLoading ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent>
              <SkeletonTable rows={6} columns={6} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent>
              <SkeletonTable rows={3} columns={4} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expenses ({list.length})</CardTitle>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(total)}</span>
          </CardHeader>
          <CardContent>
            {list.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No expenses in this session.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-600 dark:text-slate-300">
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Category</th>
                      <th className="pb-2 pr-4 font-medium">Description</th>
                      <th className="pb-2 pr-4 font-medium">Vendor</th>
                      <th className="pb-2 pr-4 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((e) => (
                      <tr key={e.id} className="border-b border-slate-100 dark:border-slate-700">
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{formatDate(e.date)}</td>
                        <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">{e.category}</td>
                        <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{e.description}</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{e.vendorPayee}</td>
                        <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">{formatCurrency(e.amount)}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpenseModal({ open: true, expense: e })}
                              title="Edit expense"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmDelete({ id: e.id, desc: e.description, type: "expense" })}
                              title="Delete expense"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {hasNextPage && expenses.length > 0 && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fixed Monthly Costs Section */}
      {selectedSessionId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Fixed Monthly Costs</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Recurring monthly expenses like rent, internet, etc.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Monthly total: <strong className="text-slate-900">{formatCurrency(totalFixedMonthly)}</strong>
              </span>
              <Button
                size="sm"
                onClick={() => setFixedCostModal({ open: true })}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add fixed cost
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sessionFixedCosts.length === 0 ? (
              <p className="text-sm text-slate-500">No fixed monthly costs configured. Add one to track recurring expenses.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="pb-2 pr-4 font-medium">Name</th>
                      <th className="pb-2 pr-4 font-medium">Category</th>
                      <th className="pb-2 pr-4 font-medium">Monthly Amount</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionFixedCosts.map((fc) => (
                      <tr key={fc.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-medium text-slate-900">{fc.name}</td>
                        <td className="py-3 pr-4 text-slate-600">{fc.category}</td>
                        <td className="py-3 pr-4 font-medium">{formatCurrency(fc.amount)}</td>
                        <td className="py-3 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${fc.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                            {fc.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFixedCostModal({ open: true, cost: fc })}
                              title="Edit fixed cost"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmDelete({ id: fc.id, desc: fc.name, type: "fixedCost" })}
                              title="Delete fixed cost"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        open={expenseModal.open}
        onClose={() => setExpenseModal({ open: false })}
        title={expenseModal.expense ? "Edit expense" : "Add expense"}
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date *</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={expenseModal.expense?.date ?? new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount (₹) *</label>
            <input
              name="amount"
              type="number"
              required
              min={0.01}
              step={0.01}
              defaultValue={expenseModal.expense?.amount}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <select
              name="category"
              defaultValue={expenseModal.expense?.category ?? "Miscellaneous"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <input
              name="description"
              type="text"
              defaultValue={expenseModal.expense?.description}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Vendor / Payee</label>
            <input
              name="vendorPayee"
              type="text"
              defaultValue={expenseModal.expense?.vendorPayee}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Payment method</label>
            <select
              name="paymentMethod"
              defaultValue={expenseModal.expense?.paymentMethod ?? "Bank Transfer"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Online">Online</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setExpenseModal({ open: false })}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedSessionId}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Fixed Cost Modal */}
      <Modal
        open={fixedCostModal.open}
        onClose={() => setFixedCostModal({ open: false })}
        title={fixedCostModal.cost ? "Edit fixed cost" : "Add fixed cost"}
      >
        <form onSubmit={handleSaveFixedCost} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g., Rent, Internet, Electricity"
              defaultValue={fixedCostModal.cost?.name}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Monthly Amount (₹) *</label>
            <input
              name="amount"
              type="number"
              required
              min={1}
              step={1}
              defaultValue={fixedCostModal.cost?.amount}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
            <select
              name="category"
              defaultValue={fixedCostModal.cost?.category ?? "Utilities"}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              {fixedCostCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={fixedCostModal.cost?.isActive ?? true}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-500"
            />
            <label className="text-sm text-slate-700 dark:text-slate-300">Active (will be counted in monthly expenses)</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setFixedCostModal({ open: false })}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedSessionId}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            if (confirmDelete.type === "expense") {
              deleteExpense(confirmDelete.id);
              toast("Expense deleted");
            } else {
              deleteFixedCost(confirmDelete.id);
              toast("Fixed cost deleted");
            }
            setConfirmDelete(null);
          }
        }}
        title={confirmDelete?.type === "expense" ? "Delete expense" : "Delete fixed cost"}
        message={`Delete "${confirmDelete?.desc}"?`}
        confirmLabel="Delete"
      />
    </div>
  );
}
