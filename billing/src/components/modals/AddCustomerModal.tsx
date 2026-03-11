import { useState } from "react";
import { Modal } from "@/components/ui";
import { addCustomerAsync } from "@/lib/store-async";
import { useBusinessMode } from "@/contexts/BusinessModeContext";
import type { CustomerType } from "@/lib/db/types";

const CUSTOMER_TYPES: CustomerType[] = ["Dealer", "Contractor", "Retail", "Builder"];

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddCustomerModal({ isOpen, onClose, onSaved }: AddCustomerModalProps) {
  const { mode } = useBusinessMode();
  const [name, setName] = useState("");
  const [customerType, setCustomerType] = useState<CustomerType>("Dealer");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert("Customer name is required"); return; }
    if (!phone.trim()) { alert("Phone is required"); return; }
    setSubmitting(true);
    try {
      await addCustomerAsync({
        name: name.trim(),
        customerType,
        phone: phone.trim(),
        gstin: gstin.trim(),
        billingAddress: billingAddress.trim(),
        shippingAddress: shippingAddress.trim() || billingAddress.trim(),
        openingBalance: 0,
        creditDays: 0,
        creditLimit: 0,
        stateCode: stateCode.trim(),
        businessType: mode,
      });
      setName(""); setCustomerType("Dealer"); setPhone(""); setGstin("");
      setBillingAddress(""); setShippingAddress(""); setStateCode("");
      onSaved();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add customer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Customer" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Customer Name *</label>
            <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Type</label>
              <select className="input" value={customerType} onChange={(e) => setCustomerType(e.target.value as CustomerType)}>
                {CUSTOMER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Phone *</label>
              <input type="text" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
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
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Billing Address</label>
            <textarea className="input min-h-[60px]" rows={3} value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Shipping Address (optional)</label>
            <textarea className="input min-h-[60px]" rows={2} value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save Customer"}</button>
        </div>
      </form>
    </Modal>
  );
}
