import { useState } from "react";
import { Modal } from "@/components/ui";
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
];

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddProductModal({ isOpen, onClose, onSaved }: AddProductModalProps) {
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
      setName("");
      setProductType("Red Clay Bricks");
      setGstRate(5);
      setSellingPrice(0);
      setCostPrice(0);
      onSaved();
      onClose();
    } catch {
      alert("Error saving product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Product" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Product Name *</label>
            <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Product Type</label>
            <select className="input" value={productType} onChange={(e) => setProductType(e.target.value as ProductType)}>
              {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>GST Rate</label>
            <select className="input" value={gstRate} onChange={(e) => setGstRate(Number(e.target.value))}>
              {GST_RATES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Selling Price (₹)</label>
              <input type="number" className="input" value={sellingPrice || ""} onChange={(e) => setSellingPrice(Number(e.target.value) || 0)} min={0} step={0.01} />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Cost Price (₹)</label>
              <input type="number" className="input" value={costPrice || ""} onChange={(e) => setCostPrice(Number(e.target.value) || 0)} min={0} step={0.01} />
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Stock starts at 0. Add stock from the Stock page.</p>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Product"}</button>
        </div>
      </form>
    </Modal>
  );
}
