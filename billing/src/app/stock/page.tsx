
import { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useProducts, useStockMovements } from "@/hooks/useStore";
import { addStockMovementAsync } from "@/lib/store-async";
import { Card, Skeleton, TableSkeleton } from "@/components/ui";
import type { Product } from "@/lib/db/types";

const today = new Date().toISOString().slice(0, 10);
const LOW_STOCK_THRESHOLD = 500;

export function StockPage() {
  const [activeTab, setActiveTab] = useState<"current" | "add" | "reduce">("current");

  const { data: products, loading: productsLoading, refetch: refetchProducts } = useProducts();
  const { data: movements, loading: movementsLoading, refetch: refetchMovements } = useStockMovements();

  const loading = productsLoading || movementsLoading;

  const productsList = useMemo(() => products ?? [], [products]);
  const movementsList = useMemo(() => movements ?? [], [movements]);

  const stockSummary = useMemo(() => {
    return productsList.map((p) => {
      const movs = movementsList.filter((m) => m.productId === p.id);
      const added = movs.filter((m) => m.type === "production" || m.type === "purchase" || m.type === "opening").reduce((s, m) => s + (m.quantity > 0 ? m.quantity : 0), 0);
      const sold = movs.filter((m) => m.type === "sale").reduce((s, m) => s + Math.abs(m.quantity), 0);
      const reduced = movs.filter((m) => m.type === "adjustment" && m.quantity < 0).reduce((s, m) => s + Math.abs(m.quantity), 0);
      return {
        product: p,
        added,
        sold,
        reduced,
        current: p.currentStock,
      };
    });
  }, [productsList, movementsList]);

  const historyList = useMemo(() => {
    return [...movementsList].sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)).slice(0, 50);
  }, [movementsList]);

  const handleSuccess = () => {
    refetchProducts();
    refetchMovements();
    setActiveTab("current");
  };

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card padding="none" className="mt-6 overflow-hidden">
          <TableSkeleton rows={6} cols={6} />
        </Card>
        <Skeleton className="h-6 w-40 mt-8 mb-2" />
        <Skeleton className="h-4 w-96 mb-3" />
        <Card padding="none" className="overflow-hidden">
          <TableSkeleton rows={8} cols={4} />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Stock
      </h1>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("current")}
          className={`btn ${activeTab === "current" ? "btn-primary" : "btn-secondary"}`}
        >
          Current stock
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("add")}
          className={`btn ${activeTab === "add" ? "btn-primary" : "btn-secondary"}`}
        >
          Add stock
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reduce")}
          className={`btn ${activeTab === "reduce" ? "btn-primary" : "btn-secondary"}`}
        >
          Reduce stock
        </button>
      </div>

      {activeTab === "current" && (
        <>
          <Card padding="none" className="mt-6 overflow-hidden">
            <div className="table-container border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Added</th>
                    <th>Sold</th>
                    <th>Reduced</th>
                    <th>Current</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stockSummary.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8" style={{ color: "var(--text-secondary)" }}>
                        No products yet.
                      </td>
                    </tr>
                  )}
                  {stockSummary.map((row) => (
                    <tr
                      key={row.product.id}
                      className="transition-colors duration-200"
                      style={{
                        background: row.current < LOW_STOCK_THRESHOLD ? "var(--warning-bg)" : undefined,
                      }}
                    >
                      <td>{row.product.name}</td>
                      <td>{row.added}</td>
                      <td>{row.sold}</td>
                      <td>{row.reduced}</td>
                      <td className="font-semibold">{row.current}</td>
                      <td>
                        {row.current < LOW_STOCK_THRESHOLD && (
<span className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded" style={{ color: "var(--warning-text)" }}>
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                          Low stock
                        </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <h3 className="text-lg font-semibold mt-8 mb-2" style={{ color: "var(--text-primary)" }}>
            Recent history
          </h3>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            Last 50 changes (adding or reducing stock, or sales).
          </p>

          <Card padding="none" className="overflow-hidden">
            <div className="table-container border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Change</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8" style={{ color: "var(--text-secondary)" }}>
                        No stock changes yet.
                      </td>
                    </tr>
                  )}
                  {historyList.map((m) => {
                    const p = productsList.find((x) => x.id === m.productId);
                    const change = m.quantity > 0 ? `+${m.quantity}` : m.quantity;
                    const reason = m.type === "sale" ? "Sale" : m.type === "purchase" ? "Purchased" : m.type === "production" || m.type === "opening" ? "Added" : "Reduced";
                    return (
                      <tr key={m.id} className="transition-colors duration-200">
                        <td>{m.date}</td>
                        <td>{p?.name ?? m.productId}</td>
                        <td>
                          <span className={m.quantity > 0 ? "text-green-600" : "text-red-600"}>
                            {change}
                          </span>
                        </td>
                        <td>{m.remarks || reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === "add" && (
        <AddStockForm products={productsList} onSuccess={handleSuccess} />
      )}

      {activeTab === "reduce" && (
        <ReduceStockForm products={productsList} onSuccess={handleSuccess} />
      )}
    </div>
  );
}

function AddStockForm({
  products,
  onSuccess,
}: {
  products: Product[];
  onSuccess: () => void;
}) {
  const [date, setDate] = useState(today);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) {
      alert("Select product and enter quantity greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      await addStockMovementAsync({
        date,
        productId,
        quantity,
        type: "purchase",
        referenceId: null,
        remarks: remarks.trim() || "Purchased",
      });
      setQuantity(0);
      setRemarks("");
      onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add stock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mt-6 max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p style={{ color: "var(--text-secondary)" }}>
          Add stock (e.g. after purchase or when you receive stock).
        </p>

        <div>
          <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Product
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="input"
            required
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Current: {p.currentStock})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Quantity to add
          </label>
          <input
            type="number"
            value={quantity || ""}
            onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            className="input"
            min={1}
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Remarks (optional)
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="input"
            placeholder="e.g. Purchase, Received"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </button>
      </form>
    </Card>
  );
}

function ReduceStockForm({
  products,
  onSuccess,
}: {
  products: Product[];
  onSuccess: () => void;
}) {
  const [date, setDate] = useState(today);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      alert("Select product.");
      return;
    }
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    if (quantity <= 0) {
      alert("Enter quantity to reduce (greater than 0).");
      return;
    }
    if (p.currentStock < quantity) {
      alert("Not enough stock. Current: " + p.currentStock);
      return;
    }
    setSubmitting(true);
    try {
      await addStockMovementAsync({
        date,
        productId,
        quantity: -quantity,
        type: "adjustment",
        referenceId: null,
        remarks: remarks.trim() || "Reduced",
      });
      setQuantity(0);
      setRemarks("");
      onSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reduce stock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mt-6 max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p style={{ color: "var(--text-secondary)" }}>
          Reduce stock (e.g. damaged or broken bricks).
        </p>

        <div>
          <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Product
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="input"
            required
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Current: {p.currentStock})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Quantity to reduce
          </label>
          <input
            type="number"
            value={quantity || ""}
            onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            className="input"
            min={1}
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Reason (optional)
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="input"
            placeholder="e.g. Damaged, broken"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </button>
      </form>
    </Card>
  );
}
