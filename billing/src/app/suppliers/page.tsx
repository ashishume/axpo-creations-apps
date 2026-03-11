
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSuppliers } from "@/hooks/useStore";
import { deleteSupplierAsync } from "@/lib/store-async";
import { Card, EditIcon, DeleteIcon, PlusIcon, Skeleton, TableSkeleton } from "@/components/ui";
import { AddSupplierModal } from "@/components/modals/AddSupplierModal";

export function SuppliersPage() {
  const { data: suppliersData, loading, refetch } = useSuppliers();
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const suppliers = useMemo(() => {
    const list = suppliersData ?? [];
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.phone && c.phone.includes(search.trim())) ||
        (c.gstin && c.gstin.toLowerCase().includes(s))
    );
  }, [suppliersData, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    const result = await deleteSupplierAsync(id);
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
          <TableSkeleton rows={8} cols={5} />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Suppliers
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Manage vendors you purchase stock from. Use Purchases to record purchase invoices and add stock.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center">
        <input
          type="text"
          placeholder="Search by name, phone or GSTIN"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full sm:w-56 min-w-0"
        />
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="btn btn-primary w-full sm:w-auto shrink-0"
        >
          <PlusIcon size={16} />
          Add Supplier
        </button>
      </div>
      <AddSupplierModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={() => refetch()}
      />

      <Card padding="none" className="mt-6 overflow-hidden">
        <div className="table-container border-0 -mx-4 sm:mx-0">
          <table className="table min-w-[520px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>GSTIN</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: "var(--text-secondary)" }}>
                    No suppliers.{" "}
                    <button type="button" onClick={() => setAddModalOpen(true)} className="text-indigo-600 hover:underline bg-transparent border-none cursor-pointer p-0">
                      Add one
                    </button>
                    .
                  </td>
                </tr>
              )}
              {suppliers.map((c) => (
                <tr key={c.id} className="transition-colors duration-200">
                  <td>{c.name}</td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.gstin || "—"}</td>
                  <td className="max-w-[200px] truncate" title={c.address || ""}>{c.address || "—"}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/suppliers/${c.id}/edit`}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors no-underline touch-manipulation"
                        title="Edit supplier"
                      >
                        <EditIcon size={16} className="text-blue-600 dark:text-blue-400" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors bg-transparent border-none cursor-pointer touch-manipulation"
                        title="Delete supplier"
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
    </div>
  );
}
