
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useSupplier } from "@/hooks/useStore";
import { updateSupplierAsync } from "@/lib/store-async";
import { Skeleton } from "@/components/ui";

export function EditSupplierPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: supplier, loading } = useSupplier(id ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [openingBalance, setOpeningBalance] = useState(0);
  const [creditDays, setCreditDays] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setPhone(supplier.phone || "");
      setGstin(supplier.gstin || "");
      setAddress(supplier.address || "");
      setStateCode(supplier.stateCode || "");
      setOpeningBalance(supplier.openingBalance ?? 0);
      setCreditDays(supplier.creditDays ?? 0);
      setCreditLimit(supplier.creditLimit ?? 0);
    }
  }, [supplier]);

  useEffect(() => {
    if (!loading && supplier === null) {
      navigate("/suppliers");
    }
  }, [loading, supplier, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Supplier name is required");
      return;
    }
    setSubmitting(true);
    try {
      await updateSupplierAsync(id!, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        gstin: gstin.trim() || undefined,
        address: address.trim() || undefined,
        stateCode: stateCode.trim() || undefined,
        openingBalance,
        creditDays,
        creditLimit,
      });
      navigate("/suppliers");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update supplier");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !supplier) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="max-w-md mt-4 space-y-4">
          <Skeleton className="h-10 w-full" count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1>Edit Supplier</h1>
      <p className="mt-2">
        <Link to="/suppliers">Back to list</Link>
      </p>
      <form onSubmit={handleSubmit} className="max-w-md mt-4">
        <div className="mb-4">
          <label className="block mb-1">Supplier Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Phone</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
        </div>
        <div className="mb-4">
          <label className="block mb-1">GSTIN</label>
          <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} className="input" />
        </div>
        <div className="mb-4">
          <label className="block mb-1">State Code</label>
          <input type="text" value={stateCode} onChange={(e) => setStateCode(e.target.value)} className="input" placeholder="e.g. 09" />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input min-h-[60px]" rows={3} />
        </div>
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Opening Balance (₹)</label>
            <input type="number" value={openingBalance || ""} onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)} className="input" step={0.01} />
          </div>
          <div>
            <label className="block mb-1">Credit Days</label>
            <input type="number" value={creditDays} onChange={(e) => setCreditDays(Number(e.target.value) || 0)} className="input" min={0} />
          </div>
          <div>
            <label className="block mb-1">Credit Limit (₹)</label>
            <input type="number" value={creditLimit || ""} onChange={(e) => setCreditLimit(Number(e.target.value) || 0)} className="input" min={0} step={0.01} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Updating..." : "Update Supplier"}
        </button>
      </form>
    </div>
  );
}
