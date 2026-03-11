import { useState } from "react";
import { Modal } from "@/components/ui";
import { addSupplierAsync } from "@/lib/store-async";
import { useBusinessMode } from "@/contexts/BusinessModeContext";

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddSupplierModal({ isOpen, onClose, onSaved }: AddSupplierModalProps) {
  const { mode } = useBusinessMode();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [stateCode, setStateCode] = useState("");
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
        openingBalance: 0,
        creditDays: 0,
        creditLimit: 0,
        businessType: mode,
      });
      setName("");
      setPhone("");
      setGstin("");
      setAddress("");
      setStateCode("");
      onSaved();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add supplier");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Supplier" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Supplier Name *</label>
            <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Phone</label>
            <input type="text" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>GSTIN (optional)</label>
            <input type="text" className="input" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>State Code (for GST)</label>
            <input type="text" className="input" value={stateCode} onChange={(e) => setStateCode(e.target.value)} placeholder="e.g. 09" />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Address</label>
            <textarea className="input min-h-[60px]" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save Supplier"}</button>
        </div>
      </form>
    </Modal>
  );
}
