
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  useInvoice,
  useInvoiceItems,
  useCustomer,
  useProducts,
} from "@/hooks/useStore";
import { updateInvoiceAsync } from "@/lib/store-async";
import { CardSkeleton } from "@/components/ui";

export function ViewInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const idOrEmpty = id ?? "";

  const { data: invoice, loading: invoiceLoading, refetch: refetchInvoice } = useInvoice(idOrEmpty);
  const { data: items, loading: itemsLoading } = useInvoiceItems(idOrEmpty);
  const { data: customer, loading: customerLoading } = useCustomer(invoice?.customerId ?? "");
  const { data: products } = useProducts();

  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loading = invoiceLoading || itemsLoading || customerLoading;

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert("Please enter a reason for cancellation.");
      return;
    }
    setCancelling(true);
    try {
      await updateInvoiceAsync(idOrEmpty, { status: "cancelled", cancelReason: cancelReason.trim() });
      await refetchInvoice();
      setShowCancel(false);
      refetchInvoice();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel invoice.");
    } finally {
      setCancelling(false);
    }
  };

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

  if (!invoice) {
    return (
      <div className="animate-fadeIn">
        <p>Invoice not found.</p>
        <Link to="/invoices">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1>Invoice {invoice.number}</h1>
      <p className="mt-2">
        <Link to="/invoices">Back to list</Link>
        {" | "}
        <Link to={`/invoices/${idOrEmpty}/print`}>Print</Link>
        {invoice.status === "final" && (
          <>
            {" | "}
            {!showCancel ? (
              <button
                type="button"
                onClick={() => setShowCancel(true)}
                className="btn bg-transparent border-none cursor-pointer underline"
                style={{ color: "var(--btn-danger)" }}
              >
                Cancel invoice
              </button>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Reason for cancellation"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="input ml-2 w-[200px] inline-block"
                />
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-danger ml-1"
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancel"}
                </button>
                <button type="button" onClick={() => setShowCancel(false)} className="btn btn-secondary ml-1">
                  Back
                </button>
              </>
            )}
          </>
        )}
      </p>
      <div className="mt-4">
        <p><strong>Date:</strong> {invoice.date}</p>
        <p><strong>Customer:</strong> {customer?.name ?? invoice.customerId}</p>
        <p><strong>Status:</strong> {invoice.status}</p>
        {invoice.status === "cancelled" && invoice.cancelReason && (
          <p><strong>Cancel reason:</strong> {invoice.cancelReason}</p>
        )}
      </div>
      <div className="table-container mt-4">
        <table className="table">
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
            {items?.map((item) => {
              const p = productMap.get(item.productId);
              return (
                <tr key={item.id}>
                  <td>{p?.name ?? item.productId}</td>
                  <td>{item.quantity}</td>
                  <td>{item.rate}</td>
                  <td>{item.discount}</td>
                  <td>{item.taxableAmount}</td>
                  <td>{item.gstAmount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 max-w-[300px] ml-auto">
        <p>Subtotal: {invoice.subtotal.toFixed(2)}</p>
        <p>Discount: {invoice.discount.toFixed(2)}</p>
        <p>Taxable: {invoice.taxableAmount.toFixed(2)}</p>
        <p>CGST: {invoice.cgstAmount.toFixed(2)} | SGST: {invoice.sgstAmount.toFixed(2)} | IGST: {invoice.igstAmount.toFixed(2)}</p>
        <p>Round off: {invoice.roundOff.toFixed(2)}</p>
        <p><strong>Grand Total: {invoice.total.toFixed(2)}</strong></p>
        <p className="text-sm">{invoice.totalInWords}</p>
      </div>
    </div>
  );
}
