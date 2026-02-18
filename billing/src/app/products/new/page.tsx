
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { addProductAsync } from "@/lib/store-async";
import type { ProductType } from "@/lib/db/types";

const PRODUCT_TYPES: ProductType[] = [
  "Red Clay Bricks",
  "Fly Ash Bricks",
  "Wire Cut Bricks",
  "Concrete Blocks",
];

const GST_RATES: { value: number; label: string }[] = [
  { value: 5, label: "5%" },
  { value: 6, label: "6%" },
  { value: 8, label: "8%" },
  { value: 9, label: "9%" },
  { value: 10, label: "10%" },
  { value: 12, label: "12%" },
  { value: 16, label: "16%" },
  { value: 18, label: "18%" },
  { value: 28, label: "28%" },
  // { value: 1, label: "CESS (1%)" },
];

export function NewProductPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [productType, setProductType] = useState<ProductType>("Red Clay Bricks");
  const [gstRate, setGstRate] = useState(5);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Product name is required");
      return;
    }
    setSaving(true);
    try {
      await addProductAsync({
        name: name.trim(),
        productType,
        hsn: "6904",
        gstRate,
        unit: "pieces",
        sellingPrice,
        costPrice,
        currentStock: 0,
      });
      navigate("/products");
    } catch {
      alert("Error saving product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1>Add Product</h1>
      <p className="mt-2">
        <Link to="/products">Back to list</Link>
      </p>
      <form onSubmit={handleSubmit} className="max-w-md mt-4">
        <div className="mb-4">
          <label className="block mb-1">Product Name *</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Product Type</label>
          <select
            className="input"
            value={productType}
            onChange={(e) => setProductType(e.target.value as ProductType)}
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">GST Rate</label>
          <select
            className="input"
            value={gstRate}
            onChange={(e) => setGstRate(Number(e.target.value))}
          >
            {GST_RATES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">Selling Price (per piece)</label>
          <input
            type="number"
            className="input"
            value={sellingPrice || ""}
            onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
            min={0}
            step={0.01}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Cost Price (per piece, for profit calculation)</label>
          <input
            type="number"
            className="input"
            value={costPrice || ""}
            onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
            min={0}
            step={0.01}
          />
          <small style={{ color: "var(--text-secondary)" }} className="block mt-1">
            You can update this later (e.g. every few months). Used only for margin/profit reports, not for GST.
          </small>
        </div>
        <p
          className="mb-4 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Stock starts at 0. Add stock later from the Stock page.
        </p>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  );
}
