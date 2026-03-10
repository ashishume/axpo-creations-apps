import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useStocksBySessionInfinite, useCreateStock, useUpdateStock, useDeleteStock, useAddStockTransaction } from "../hooks/useStocks";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Skeleton, SkeletonTable } from "../components/ui/Skeleton";
import { Plus, Pencil, Trash2, CheckCircle, ArrowDownCircle, ArrowUpCircle, RotateCcw } from "lucide-react";
import type { Stock, StockTransactionType } from "../types";
import { formatCurrency, formatDate } from "../lib/utils";
import { cn } from "../lib/utils";
import { Tooltip } from "../components/ui/Tooltip";

const statusColors = {
  open: "bg-amber-100 text-amber-800",
  cleared: "bg-green-100 text-green-800",
};

export function StocksPage() {
  const { selectedSessionId, toast } = useApp();

  const {
    stocks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isAppLoading,
  } = useStocksBySessionInfinite(selectedSessionId ?? "");
  const createStock = useCreateStock();
  const updateStockMut = useUpdateStock();
  const deleteStockMut = useDeleteStock();
  const addTxMut = useAddStockTransaction();

  const addStock = (data: Omit<Stock, "id" | "transactions">) => createStock.mutate(data);
  const updateStock = (id: string, data: Partial<Stock>) => updateStockMut.mutate({ id, updates: data });
  const deleteStock = (id: string) => deleteStockMut.mutate(id);
  const addStockTransaction = (stockId: string, transaction: Omit<import("../types").StockTransaction, "id">) =>
    addTxMut.mutate({ stockId, transaction });
  const settleStock = (stockId: string, settledAmount: number) => {
    const settledDate = new Date().toISOString().slice(0, 10);
    updateStockMut.mutate({ id: stockId, updates: { status: "cleared", settledDate, settledAmount } });
  };

  const [stockModal, setStockModal] = useState<{ open: boolean; stock?: Stock }>({ open: false });
  const [transactionModal, setTransactionModal] = useState<{ open: boolean; stock: Stock; type: StockTransactionType } | null>(null);
  const [detailsStock, setDetailsStock] = useState<Stock | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const sessionStocks = stocks;

  const handleSaveStock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSessionId) return;
    const form = e.currentTarget;
    const publisherName = (form.elements.namedItem("publisherName") as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem("description") as HTMLInputElement).value.trim();
    const purchaseDate = (form.elements.namedItem("purchaseDate") as HTMLInputElement).value;
    const totalCreditAmount = Number((form.elements.namedItem("totalCreditAmount") as HTMLInputElement).value);
    const notes = (form.elements.namedItem("notes") as HTMLTextAreaElement).value.trim();
    
    if (!publisherName || !purchaseDate || totalCreditAmount <= 0) return;
    
    if (stockModal.stock) {
      updateStock(stockModal.stock.id, { publisherName, description, purchaseDate, totalCreditAmount, notes });
      toast("Stock updated");
    } else {
      addStock({
        sessionId: selectedSessionId,
        publisherName,
        description,
        purchaseDate,
        totalCreditAmount,
        status: "open",
        notes,
      });
      toast("Stock added");
    }
    setStockModal({ open: false });
  };

  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!transactionModal) return;
    const form = e.currentTarget;
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value);
    const quantity = (form.elements.namedItem("quantity") as HTMLInputElement).value;
    const description = (form.elements.namedItem("description") as HTMLInputElement).value.trim();
    const receiptNumber = (form.elements.namedItem("receiptNumber") as HTMLInputElement).value.trim();
    
    if (!date || amount <= 0) return;
    
    addStockTransaction(transactionModal.stock.id, {
      date,
      type: transactionModal.type,
      amount,
      quantity: quantity ? Number(quantity) : undefined,
      description,
      receiptNumber: receiptNumber || undefined,
    });
    toast(`${transactionModal.type === "sale" ? "Sale" : "Return"} recorded`);
    setTransactionModal(null);
  };

  const getStockSummary = (stock: Stock) => {
    const totalSold = stock.transactions.filter(t => t.type === "sale").reduce((sum, t) => sum + t.amount, 0);
    const totalReturned = stock.transactions.filter(t => t.type === "return").reduce((sum, t) => sum + t.amount, 0);
    const remainingCredit = stock.totalCreditAmount - totalSold - totalReturned;
    return { totalSold, totalReturned, remainingCredit };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 sm:text-2xl">Stock & Publishers</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 sm:text-base">Track books/supplies bought on credit from publishers</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={!selectedSessionId}
            onClick={() => setStockModal({ open: true })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add stock purchase
          </Button>
        </div>
      </div>

      {!selectedSessionId ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400">
            Select a school and session to view stocks.
          </CardContent>
        </Card>
      ) : isAppLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <SkeletonTable rows={6} columns={9} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Stock Purchases ({sessionStocks.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Stock purchases are automatically added as expenses. Record sales to track income from sold items.
              Returns reduce the remaining stock value. Sales are shown as income in your dashboard.
            </p>
            {sessionStocks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No stock purchases yet. Add one to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="pb-2 pr-4 font-medium">Publisher</th>
                      <th className="pb-2 pr-4 font-medium">Description</th>
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Credit Amount</th>
                      <th className="pb-2 pr-4 font-medium">Sold</th>
                      <th className="pb-2 pr-4 font-medium">Returned</th>
                      <th className="pb-2 pr-4 font-medium">Remaining</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionStocks.map((s) => {
                      const { totalSold, totalReturned, remainingCredit } = getStockSummary(s);
                      return (
                        <tr key={s.id} className="border-b border-slate-100">
                          <td className="py-3 pr-4 font-medium text-slate-900">{s.publisherName}</td>
                          <td className="py-3 pr-4 text-slate-600 max-w-[200px] truncate">{s.description}</td>
                          <td className="py-3 pr-4 text-slate-600">{formatDate(s.purchaseDate)}</td>
                          <td className="py-3 pr-4">{formatCurrency(s.totalCreditAmount)}</td>
                          <td className="py-3 pr-4 text-green-600">{formatCurrency(totalSold)}</td>
                          <td className="py-3 pr-4 text-amber-600">{formatCurrency(totalReturned)}</td>
                          <td className="py-3 pr-4 font-medium">{formatCurrency(remainingCredit)}</td>
                          <td className="py-3 pr-4">
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[s.status])}>
                              {s.status === "open" ? "Open" : "Cleared"}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1 [&_button]:min-h-[44px] [&_button]:min-w-[44px] [&_button]:touch-manipulation md:[&_button]:min-h-0 md:[&_button]:min-w-0">
                              {s.status === "open" && (
                                <>
                                  <Tooltip text="Record sale – add a sale transaction for this stock">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setTransactionModal({ open: true, stock: s, type: "sale" })}
                                      aria-label="Record sale"
                                    >
                                      <ArrowUpCircle className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </Tooltip>
                                  <Tooltip text="Record return – add a return transaction for unsold items">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setTransactionModal({ open: true, stock: s, type: "return" })}
                                      aria-label="Record return"
                                    >
                                      <RotateCcw className="h-4 w-4 text-amber-600" />
                                    </Button>
                                  </Tooltip>
                                  <Tooltip text="Mark as complete – close this stock entry">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const { remainingCredit } = getStockSummary(s);
                                        settleStock(s.id, remainingCredit);
                                        toast("Stock marked as complete");
                                      }}
                                      aria-label="Mark as complete"
                                    >
                                      <CheckCircle className="h-4 w-4 text-indigo-600" />
                                    </Button>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip text="View details – see full transaction history and summary">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDetailsStock(s)}
                                  aria-label="View details"
                                >
                                  <ArrowDownCircle className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                              <Tooltip text="Edit stock – change publisher, description, dates or amounts">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setStockModal({ open: true, stock: s })}
                                  aria-label="Edit stock"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                              <Tooltip text="Delete stock – remove this stock purchase and all its transactions">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => setConfirmDelete({ id: s.id, name: s.publisherName })}
                                  aria-label="Delete stock"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {hasNextPage && stocks.length > 0 && (
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

      {/* Add/Edit Stock Modal */}
      <Modal
        open={stockModal.open}
        onClose={() => setStockModal({ open: false })}
        title={stockModal.stock ? "Edit stock purchase" : "Add stock purchase"}
      >
        <form onSubmit={handleSaveStock} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Publisher name *</label>
            <input
              name="publisherName"
              type="text"
              required
              defaultValue={stockModal.stock?.publisherName}
              placeholder="e.g. ABC Publications"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <input
              name="description"
              type="text"
              defaultValue={stockModal.stock?.description}
              placeholder="e.g. Books for 2024-25 session"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Purchase date *</label>
              <input
                name="purchaseDate"
                type="date"
                required
                defaultValue={stockModal.stock?.purchaseDate ?? new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Credit amount (₹) *</label>
              <input
                name="totalCreditAmount"
                type="number"
                required
                min={1}
                defaultValue={stockModal.stock?.totalCreditAmount}
                placeholder="e.g. 100000"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={stockModal.stock?.notes}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setStockModal({ open: false })}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Transaction Modal (Sale/Return) */}
      {transactionModal && (
        <Modal
          open={transactionModal.open}
          onClose={() => setTransactionModal(null)}
          title={`Record ${transactionModal.type === "sale" ? "sale" : "return"} – ${transactionModal.stock.publisherName}`}
        >
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {transactionModal.type === "sale" 
                ? "Record items sold to students/customers"
                : "Record items returned to publisher"}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date *</label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount (₹) *</label>
                <input
                  name="amount"
                  type="number"
                  required
                  min={1}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity (optional)</label>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Receipt #</label>
                <input
                  name="receiptNumber"
                  type="text"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <input
                name="description"
                type="text"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setTransactionModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Record {transactionModal.type}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Details Modal */}
      {detailsStock && (
        <Modal
          open={!!detailsStock}
          onClose={() => setDetailsStock(null)}
          title={`Stock details – ${detailsStock.publisherName}`}
        >
          <div className="space-y-4">
            {(() => {
              const { totalSold, totalReturned, remainingCredit } = getStockSummary(detailsStock);
              return (
                <>
                  <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-1">
                    <p><strong>Publisher:</strong> {detailsStock.publisherName}</p>
                    <p><strong>Description:</strong> {detailsStock.description || "—"}</p>
                    <p><strong>Purchase date:</strong> {formatDate(detailsStock.purchaseDate)}</p>
                    <p><strong>Credit amount:</strong> {formatCurrency(detailsStock.totalCreditAmount)}</p>
                    <p><strong>Total sold:</strong> <span className="text-green-600">{formatCurrency(totalSold)}</span></p>
                    <p><strong>Total returned:</strong> <span className="text-amber-600">{formatCurrency(totalReturned)}</span></p>
                    <p><strong>Remaining:</strong> {formatCurrency(remainingCredit)}</p>
                    <p><strong>Status:</strong> {detailsStock.status === "open" ? "Open" : `Cleared (₹${detailsStock.settledAmount?.toLocaleString()} on ${formatDate(detailsStock.settledDate!)})`}</p>
                    {detailsStock.notes && <p><strong>Notes:</strong> {detailsStock.notes}</p>}
                  </div>
                  <h4 className="font-medium text-slate-900">Transactions</h4>
                  {detailsStock.transactions.length === 0 ? (
                    <p className="text-sm text-slate-500">No transactions yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-slate-600">
                          <th className="pb-1 pr-2 font-medium">Date</th>
                          <th className="pb-1 pr-2 font-medium">Type</th>
                          <th className="pb-1 pr-2 font-medium">Amount</th>
                          <th className="pb-1 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailsStock.transactions.map((t) => (
                          <tr key={t.id} className="border-b border-slate-100">
                            <td className="py-1.5 pr-2">{formatDate(t.date)}</td>
                            <td className={cn("py-1.5 pr-2 capitalize", t.type === "sale" ? "text-green-600" : "text-amber-600")}>
                              {t.type}
                            </td>
                            <td className="py-1.5 pr-2">{formatCurrency(t.amount)}</td>
                            <td className="py-1.5">{t.description || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              );
            })()}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteStock(confirmDelete.id);
            toast("Stock deleted");
            setConfirmDelete(null);
          }
        }}
        title="Delete stock"
        message={`Delete stock from "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
