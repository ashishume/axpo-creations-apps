
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { addCustomerAsync } from "@/lib/store-async";
import type { CustomerType } from "@/lib/db/types";

const CUSTOMER_TYPES: CustomerType[] = ["Dealer", "Contractor", "Retail", "Builder"];

export function NewCustomerPage() {
  const navigate = useNavigate();
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
    if (!name.trim()) {
      alert("Customer name is required");
      return;
    }
    if (!phone.trim()) {
      alert("Phone is required");
      return;
    }
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
      });
      navigate("/customers");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add customer");
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1>Add Customer</h1>
      <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
        Create a customer profile. Sales and revenue are tracked when you create invoices for this customer.
      </p>
      <p className="mt-2">
        <Link to="/customers">Back to list</Link>
      </p>
      <form onSubmit={handleSubmit} className="max-w-md mt-4">
        <div className="mb-4">
          <label className="block mb-1">Customer Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Type</label>
          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value as CustomerType)}
            className="input"
          >
            {CUSTOMER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">Phone *</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            required
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
          <label className="block mb-1">State Code (for GST – same state vs different state)</label>
          <input
            type="text"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="input"
            placeholder="e.g. 09"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Billing Address</label>
          <textarea
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            className="input min-h-[60px]"
            rows={3}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Shipping Address (optional)</label>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            className="input min-h-[60px]"
            rows={2}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Customer"}
        </button>
      </form>
    </div>
  );
}
