
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { Skeleton, TableSkeleton } from "@/components/ui";

const LOW_STOCK = 500;

export function StockReportPage() {
  const { data, loading } = useStore();

  const rows = useMemo(() => {
    const products = data?.products ?? [];
    const movements = data?.stockMovements ?? [];
    return products.map((p) => {
      const movs = movements.filter((m) => m.productId === p.id);
      const added = movs.filter((m) => m.type === "production" || m.type === "purchase" || m.type === "opening").reduce((s, m) => s + (m.quantity > 0 ? m.quantity : 0), 0);
      const sold = movs.filter((m) => m.type === "sale").reduce((s, m) => s + Math.abs(m.quantity), 0);
      const reduced = movs.filter((m) => m.type === "adjustment" && m.quantity < 0).reduce((s, m) => s + Math.abs(m.quantity), 0);
      return { product: p, added, sold, reduced, current: p.currentStock };
    });
  }, [data]);

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1>Stock Report</h1>
      <p className="mt-2">
        <Link to="/reports">Back to reports</Link>
      </p>
      <div className="table-container mt-6">
        <table className="table">
          <thead>
            <tr className="border-b-2" style={{ borderColor: "var(--border)" }}>
              <th>Product</th>
              <th>Added</th>
              <th>Sold</th>
              <th>Reduced</th>
              <th>Current</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.product.id}
                style={r.current < LOW_STOCK ? { background: "var(--warning-bg)" } : undefined}
              >
                <td>{r.product.name}</td>
                <td>{r.added}</td>
                <td>{r.sold}</td>
                <td>{r.reduced}</td>
                <td>
                  {r.current}{" "}
                  {r.current < LOW_STOCK && (
                    <span style={{ color: "var(--warning-text)" }}>(Low stock)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
