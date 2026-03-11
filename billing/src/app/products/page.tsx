import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useStore";
import { deleteProductAsync } from "@/lib/store-async";
import { Card, EditIcon, DeleteIcon, PlusIcon, Skeleton, TableSkeleton } from "@/components/ui";
import { AddProductModal } from "@/components/modals/AddProductModal";

export function ProductsPage() {
  const { data: products, loading, refetch } = useProducts();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const typeOptions = useMemo(() => {
    const list = products ?? [];
    return [...new Set(list.map((p) => p.productType).filter(Boolean))].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const list = products ?? [];
    let out = list;
    if (typeFilter) out = out.filter((p) => p.productType === typeFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.productType.toLowerCase().includes(s)
      );
    }
    return out;
  }, [products, search, typeFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete product "${name}"?`)) return;
    const result = await deleteProductAsync(id);
    if (result.ok) {
      refetch();
    } else {
      alert(result.error);
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="mt-4 flex flex-wrap gap-4 items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card padding="none" className="mt-6 overflow-hidden">
          <TableSkeleton rows={8} cols={8} />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Products
      </h1>

      <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center">
        <input
          type="text"
          placeholder="Search by name or type"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full sm:w-56 min-w-0"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-full sm:w-44 min-w-0"
          style={{ color: "var(--text-primary)" }}
        >
          <option value="">All types</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="btn btn-primary w-full sm:w-auto shrink-0"
        >
          <PlusIcon size={16} />
          Add Product
        </button>
      </div>
      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={() => refetch()}
      />

      <Card padding="none" className="mt-6 overflow-hidden">
        <div className="table-container border-0 -mx-4 sm:mx-0">
          <table className="table min-w-[640px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>GST %</th>
                <th>Selling</th>
                <th>Cost</th>
                <th>Margin</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8" style={{ color: "var(--text-secondary)" }}>
                    No products.{" "}
                    <button type="button" onClick={() => setAddModalOpen(true)} className="text-indigo-600 hover:underline bg-transparent border-none cursor-pointer p-0">
                      Add one
                    </button>
                    .
                  </td>
                </tr>
              )}
              {filteredProducts.map((p) => {
                const cost = p.costPrice ?? 0;
                const margin = cost > 0 ? p.sellingPrice - cost : null;
                return (
                  <tr key={p.id} className="transition-colors duration-200">
                    <td>{p.name}</td>
                    <td>{p.productType}</td>
                    <td>{p.gstRate === 1 ? "CESS (1%)" : `${p.gstRate}%`}</td>
                    <td>₹{p.sellingPrice}</td>
                    <td>{cost ? `₹${cost}` : "—"}</td>
                    <td>
                      {margin != null
                        ? `₹${margin} (${p.sellingPrice ? ((margin / p.sellingPrice) * 100).toFixed(0) : 0}%)`
                        : "—"}
                    </td>
                    <td>{p.currentStock}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/products/${p.id}/edit`}
                          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors no-underline touch-manipulation"
                          title="Edit product"
                        >
                          <EditIcon size={16} className="text-blue-600 dark:text-blue-400" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors bg-transparent border-none cursor-pointer touch-manipulation"
                          title="Delete product"
                        >
                          <DeleteIcon size={16} style={{ color: "var(--btn-danger)" }} />
                        </button>
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
