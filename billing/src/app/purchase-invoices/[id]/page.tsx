
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  usePurchaseInvoice,
  usePurchaseInvoiceItems,
  useSupplier,
  useProducts,
} from "@/hooks/useStore";
import { CardSkeleton } from "@/components/ui";

export function ViewPurchaseInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const idOrEmpty = id ?? "";

  const { data: purchaseInvoice, loading: piLoading } = usePurchaseInvoice(idOrEmpty);
  const { data: items, loading: itemsLoading } = usePurchaseInvoiceItems(idOrEmpty);
  const { data: supplier, loading: supplierLoading } = useSupplier(purchaseInvoice?.supplierId ?? "");
  const { data: products } = useProducts();

  const loading = piLoading || itemsLoading || supplierLoading;

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <CardSkeleton />
        <div className="mt-4">
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!purchaseInvoice) {
    return (
      <div className="animate-fadeIn">
        <p>Purchase invoice not found.</p>
        <Link to="/purchase-invoices">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Purchase Invoice {purchaseInvoice.number}
      </h1>
      <p className="mt-2">
        <Link to="/purchase-invoices">Back to list</Link>
      </p>
      <div className="mt-4 space-y-1 text-sm" style={{ color: "var(--text-primary)" }}>
        <p><strong>Date:</strong> {purchaseInvoice.date}</p>
        <p><strong>Supplier:</strong> {(supplier?.name ?? purchaseInvoice.supplierId) || "—"}</p>
        <p><strong>Status:</strong> {purchaseInvoice.status}</p>
      </div>
      <div className="table-container mt-6 overflow-x-auto">
        <table className="table min-w-[520px]">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Discount</th>
              <th>Amount</th>
              <th>GST</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item) => {
              const p = productMap.get(item.productId);
              return (
                <tr key={item.id}>
                  <td>{p?.name ?? item.productId}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.rate.toFixed(2)}</td>
                  <td>₹{(item.discount ?? 0).toFixed(2)}</td>
                  <td>₹{item.taxableAmount?.toFixed(2) ?? item.lineTotal.toFixed(2)}</td>
                  <td>₹{(item.gstAmount ?? 0).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-6 max-w-[320px] ml-auto space-y-1 text-sm">
        <p className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>Subtotal</span> ₹{purchaseInvoice.subtotal.toFixed(2)}</p>
        <p className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>Discount</span> ₹{purchaseInvoice.discount.toFixed(2)}</p>
        <p className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>Taxable</span> ₹{purchaseInvoice.taxableAmount.toFixed(2)}</p>
        <p className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>CGST</span> ₹{purchaseInvoice.cgstAmount.toFixed(2)}</p>
        <p className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>SGST</span> ₹{purchaseInvoice.sgstAmount.toFixed(2)}</p>
        <p className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>IGST</span> ₹{purchaseInvoice.igstAmount.toFixed(2)}</p>
        {purchaseInvoice.roundOff !== 0 && (
          <p className="flex justify-between"><span style={{ color: "var(--text-secondary)" }}>Round off</span> ₹{purchaseInvoice.roundOff.toFixed(2)}</p>
        )}
        <p className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <span>Grand Total</span>
          <span>₹{purchaseInvoice.total.toFixed(2)}</span>
        </p>
        {purchaseInvoice.totalInWords && (
          <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>{purchaseInvoice.totalInWords}</p>
        )}
      </div>
    </div>
  );
}
