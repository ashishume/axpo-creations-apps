
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useCustomer } from "@/hooks/useStore";
import { updateCustomerAsync } from "@/lib/store-async";
import { Skeleton } from "@/components/ui";
import { CUSTOMER_TYPES, type CustomerType } from "@/lib/db/types";

export function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, loading } = useCustomer(id ?? "");
  const [name, setName] = useState("");
  const [customerType, setCustomerType] = useState<CustomerType>("Dealer");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setName(customer.name);
    setCustomerType(customer.customerType);
    setPhone(customer.phone);
    setGstin(customer.gstin || "");
    setBillingAddress(customer.billingAddress || "");
    setShippingAddress(customer.shippingAddress || "");
    setStateCode(customer.stateCode || "");
  }, [customer]);

  useEffect(() => {
    if (!loading && customer === null) {
      navigate("/customers");
    }
  }, [loading, customer, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Name and Phone are required");
      return;
    }
    setSubmitting(true);
    try {
      await updateCustomerAsync(id!, {
        name: name.trim(),
        customerType,
        phone: phone.trim(),
        gstin: gstin.trim(),
        billingAddress: billingAddress.trim(),
        shippingAddress: shippingAddress.trim(),
        stateCode: stateCode.trim(),
      });
      navigate("/customers");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update customer");
      setSubmitting(false);
    }
  };

  if (loading || !customer) {
    return (
      <div className="animate-fadeIn">
        <h1>Edit Customer</h1>
        <p className="mt-2">
          <Link to="/customers">Back to list</Link>
        </p>
        <div className="max-w-md mt-4 space-y-4">
          <Skeleton className="h-10 w-full" count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1>Edit Customer</h1>
      <p className="mt-2">
        <Link to="/customers">Back to list</Link>
      </p>
      <form onSubmit={handleSubmit} className="max-w-md mt-4">
        <div className="mb-4">
          <label className="block mb-1">
            Customer Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">
            Type
          </label>
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
          <label className="block mb-1">
            Phone *
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">
            GSTIN (optional)
          </label>
          <input
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            className="input"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">
            State Code (for GST)
          </label>
          <input
            type="text"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="input"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">
            Billing Address
          </label>
          <textarea
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            className="input min-h-[60px]"
            rows={3}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">
            Shipping Address (optional)
          </label>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            className="input min-h-[60px]"
            rows={2}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Updating..." : "Update Customer"}
        </button>
      </form>
    </div>
  );
}
