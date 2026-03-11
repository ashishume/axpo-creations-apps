
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { addSupplierAsync } from "@/lib/store-async";
import { useBusinessMode } from "@/contexts/BusinessModeContext";

export function NewSupplierPage() {
  const navigate = useNavigate();
  const { mode } = useBusinessMode();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [openingBalance, setOpeningBalance] = useState(0);
  const [creditDays, setCreditDays] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Supplier name is required");
      return;
    }
    setSubmitting(true);
    try {
      await addSupplierAsync({
        name: name.trim(),
        phone: phone.trim() || "",
        gstin: gstin.trim() || "",
        address: address.trim() || "",
        stateCode: stateCode.trim() || "",
        openingBalance,
        creditDays,
        creditLimit,
        businessType: mode,
      });
      navigate("/suppliers");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add supplier");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1>Add Supplier</h1>
      <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
        Add a vendor you purchase stock from. You can then create purchase invoices and stock will be added automatically.
      </p>
      <p className="mt-2">
        <Link to="/suppliers">Back to list</Link>
      </p>
      <form onSubmit={handleSubmit} className="max-w-md mt-4">
        <div className="mb-4">
          <label className="block mb-1">Supplier Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">GSTIN (optional)</label>
          <input
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            className="input"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">State Code (for GST)</label>
          <input
            type="text"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="input"
            placeholder="e.g. 09"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input min-h-[60px]"
            rows={3}
          />
        </div>
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Opening Balance (₹)</label>
            <input
              type="number"
              value={openingBalance || ""}
              onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)}
              className="input"
              step={0.01}
            />
          </div>
          <div>
            <label className="block mb-1">Credit Days</label>
            <input
              type="number"
              value={creditDays}
              onChange={(e) => setCreditDays(Number(e.target.value) || 0)}
              className="input"
              min={0}
            />
          </div>
          <div>
            <label className="block mb-1">Credit Limit (₹)</label>
            <input
              type="number"
              value={creditLimit || ""}
              onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
              className="input"
              min={0}
              step={0.01}
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Supplier"}
        </button>
      </form>
    </div>
  );
}
