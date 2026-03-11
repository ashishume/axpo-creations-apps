import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useProduct, useProducts } from "@/hooks/useStore";
import { updateProductAsync } from "@/lib/store-async";
import type { ProductType } from "@/lib/db/types";
import { Skeleton } from "@/components/ui";

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

export function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, loading } = useProduct(id ?? "");
  const { data: products } = useProducts();
  const [name, setName] = useState("");
  const [productType, setProductType] = useState<ProductType>("");
  const [hsn, setHsn] = useState("");
  const [gstRate, setGstRate] = useState(5);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);
  const [saving, setSaving] = useState(false);

  const productTypeSuggestions = useMemo(() => {
    const list = products ?? [];
    return [...new Set(list.map((p) => p.productType).filter(Boolean))].sort();
  }, [products]);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setProductType(product.productType);
      setHsn(product.hsn ?? "");
      setGstRate(product.gstRate);
      setSellingPrice(product.sellingPrice);
      setCostPrice(product.costPrice ?? 0);
      setCurrentStock(product.currentStock);
    }
  }, [product]);

  useEffect(() => {
    if (!loading && product === null) {
      navigate("/products");
    }
  }, [loading, product, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Product name is required");
      return;
    }
    if (!productType.trim()) {
      alert("Product type is required");
      return;
    }
    setSaving(true);
    try {
      await updateProductAsync(id!, {
        name: name.trim(),
        productType: productType.trim(),
        hsn: hsn.trim() || undefined,
        gstRate,
        sellingPrice,
        costPrice,
        // Stock is updated only from the Stock page; HSN editable on form
      });
      navigate("/products");
    } catch {
      alert("Error updating product");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="max-w-md mt-4 space-y-4">
          <Skeleton className="h-10 w-full" count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1>Edit Product</h1>
      <p className="mt-2">
        <Link to="/products">Back to list</Link>
      </p>
      <form onSubmit={handleSubmit} className="max-w-md mt-4">
        <div className="mb-4">
          <label className="block mb-1">Product Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Product Type *</label>
          <input
            type="text"
            className="input"
            list="product-type-list-edit"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            placeholder="e.g. Ceramic Tiles, Vitrified Tiles"
          />
          <datalist id="product-type-list-edit">
            {productTypeSuggestions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div className="mb-4">
          <label className="block mb-1">HSN Code</label>
          <input
            type="text"
            className="input"
            value={hsn}
            onChange={(e) => setHsn(e.target.value)}
            placeholder="e.g. 6904, 6907, 6908"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">GST Rate</label>
          <select
            value={gstRate}
            onChange={(e) => setGstRate(Number(e.target.value))}
            className="input"
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
            value={sellingPrice || ""}
            onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
            className="input"
            min={0}
            step={0.01}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Cost Price (per piece, for profit)</label>
          <input
            type="number"
            value={costPrice || ""}
            onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
            className="input"
            min={0}
            step={0.01}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Current stock</label>
          <div className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
            {currentStock} pieces
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            To add or reduce stock, use the Stock page.
          </p>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Updating..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}
