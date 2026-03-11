
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCustomers } from "@/hooks/useStore";
import { deleteCustomerAsync } from "@/lib/store-async";
import { Card, EditIcon, DeleteIcon, ViewIcon, PlusIcon, TableSkeleton } from "@/components/ui";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";
import { CUSTOMER_TYPES, type CustomerType } from "@/lib/db/types";

export function CustomersPage() {
  const { data: customersData, loading, refetch } = useCustomers();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CustomerType | "">("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const customers = useMemo(() => {
    const list = customersData ?? [];
    let out = list;
    if (typeFilter) out = out.filter((c) => c.customerType === typeFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      out = out.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.phone.includes(search.trim())
      );
    }
    return out;
  }, [customersData, search, typeFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete customer "${name}"?`)) return;
    const result = await deleteCustomerAsync(id);
    if (result.ok) {
      refetch();
    } else {
      alert(result.error);
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Customers
        </h1>
        <div className="mt-6">
          <TableSkeleton rows={8} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Customers
      </h1>

      <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center">
        <input
          type="text"
          placeholder="Search by name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full sm:w-56 min-w-0"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter((e.target.value || "") as CustomerType | "")}
          className="input w-full sm:w-40 min-w-0"
          style={{ color: "var(--text-primary)" }}
        >
          <option value="">All types</option>
          {CUSTOMER_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="btn btn-primary w-full sm:w-auto shrink-0"
        >
          <PlusIcon size={16} />
          Add Customer
        </button>
      </div>
      <AddCustomerModal
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
                <th>Type</th>
                <th>Phone</th>
                <th>GSTIN</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: "var(--text-secondary)" }}>
                    No customers.{" "}
                    <button type="button" onClick={() => setAddModalOpen(true)} className="text-indigo-600 hover:underline bg-transparent border-none cursor-pointer p-0">
                      Add one
                    </button>
                    .
                  </td>
                </tr>
              )}
              {customers.map((c) => (
                <tr key={c.id} className="transition-colors duration-200">
                  <td>{c.name}</td>
                  <td>{c.customerType}</td>
                  <td>{c.phone}</td>
                  <td>{c.gstin || "—"}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/customers/${c.id}/edit`}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors no-underline touch-manipulation"
                        title="Edit customer"
                      >
                        <EditIcon size={16} className="text-blue-600 dark:text-blue-400" />
                      </Link>
                      <Link
                        to={`/reports/ledger?customerId=${c.id}`}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors no-underline touch-manipulation"
                        title="View ledger"
                      >
                        <ViewIcon size={16} className="text-green-600 dark:text-green-400" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors bg-transparent border-none cursor-pointer touch-manipulation"
                        title="Delete customer"
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
