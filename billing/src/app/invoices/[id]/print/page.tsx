
import { useParams, Link } from "react-router-dom";
import {
  useInvoice,
  useInvoiceItems,
  useCustomer,
  useCompany,
  useProducts,
} from "@/hooks/useStore";
import { CardSkeleton } from "@/components/ui";

export function PrintInvoicePage() {
  const params = useParams();
  const id = params.id as string;

  const { data: invoice, loading: invoiceLoading } = useInvoice(id);
  const { data: items, loading: itemsLoading } = useInvoiceItems(id);
  const customerId = invoice?.customerId ?? "";
  const { data: customer, loading: customerLoading } = useCustomer(customerId, { enabled: !!customerId });
  const { data: company, loading: companyLoading } = useCompany();
  const { data: products } = useProducts();

  const loading = invoiceLoading || itemsLoading || (customerId && customerLoading) || companyLoading;

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

  if (!invoice) {
    return (
      <div>
        <p>Invoice not found.</p>
        <Link to="/invoices">Back</Link>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="print-area animate-fadeIn bg-white text-slate-900 p-6 sm:p-8 max-w-[210mm] mx-auto shadow-sm">
      {/* Header: Company + Invoice title */}
      <header className="pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            {company?.logoPath && (
              <img src={company.logoPath} alt="Logo" className="h-16 mb-3 object-contain" />
            )}
            <h1 className="text-2xl font-bold text-slate-900 m-0">{company?.name ?? ""}</h1>
            <p className="text-sm text-slate-600 mt-2 mb-0 leading-relaxed max-w-[280px]">{company?.address ?? ""}</p>
            <div className="mt-2 space-y-0.5 text-sm">
              <p className="m-0 text-slate-600">
                <span className="font-medium">GSTIN:</span> <span className="text-slate-800">{company?.gstin ?? ""}</span>
                {company?.pan && (
                  <> &nbsp;| <span className="font-medium">PAN:</span> <span className="text-slate-800">{company.pan}</span></>
                )}
              </p>
              <p className="m-0 text-slate-600">
                <span className="font-medium">Ph:</span> {company?.phone ?? ""}
                {company?.email && <> &nbsp;| <span className="font-medium">Email:</span> {company.email}</>}
              </p>
            </div>
          </div>
          <div className="text-right sm:min-w-[200px]">
            <div className="inline-block bg-slate-800 text-white px-4 py-2 rounded">
              <h2 className="text-lg font-bold uppercase tracking-wide m-0">
                Tax Invoice
              </h2>
            </div>
            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 text-slate-500 text-left">Invoice No</td>
                    <td className="py-2 px-3 font-bold text-slate-900 text-right">{invoice.number}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-500 text-left">Date</td>
                    <td className="py-2 px-3 font-medium text-slate-900 text-right">{formatDate(invoice.date)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </header>

      <hr className="border-slate-300 mb-6" />

      {/* Bill To & Ship To */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-slate-800 rounded"></span>
            Bill To
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[100px]">
            {customer ? (
              <>
                <p className="font-bold text-slate-900 m-0 text-base">{customer.name}</p>
                {customer.phone && (
                  <p className="text-sm text-slate-600 mt-1 mb-0">
                    <span className="font-medium">Ph:</span> {customer.phone}
                  </p>
                )}
                {customer.billingAddress && (
                  <p className="text-sm text-slate-600 mt-1 mb-0 leading-relaxed">{customer.billingAddress}</p>
                )}
                {customer.gstin && (
                  <p className="text-sm text-slate-600 mt-2 mb-0">
                    <span className="font-medium">GSTIN:</span> {customer.gstin}
                  </p>
                )}
                {customer.stateCode && (
                  <p className="text-sm text-slate-600 mt-0.5 mb-0">
                    <span className="font-medium">State Code:</span> {customer.stateCode}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500 italic m-0">Customer details not available</p>
            )}
          </div>
        </section>

        {customer?.shippingAddress && customer.shippingAddress !== customer.billingAddress && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-slate-800 rounded"></span>
              Ship To
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[100px]">
              <p className="font-bold text-slate-900 m-0 text-base">{customer.name}</p>
              <p className="text-sm text-slate-600 mt-1 mb-0 leading-relaxed">{customer.shippingAddress}</p>
            </div>
          </section>
        )}
      </div>

      {/* Line items table */}
      <section className="mb-6">
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="text-center py-3 px-3 font-semibold w-10">#</th>
                <th className="text-left py-3 px-3 font-semibold">Particulars</th>
                <th className="text-center py-3 px-3 font-semibold w-16">Qty</th>
                <th className="text-right py-3 px-3 font-semibold w-24">Rate</th>
                <th className="text-right py-3 px-3 font-semibold w-20">Disc</th>
                <th className="text-right py-3 px-3 font-semibold w-24">Taxable</th>
                <th className="text-right py-3 px-3 font-semibold w-20">GST</th>
                <th className="text-right py-3 px-3 font-semibold w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item, idx) => {
                const p = productMap.get(item.productId);
                const amount = item.taxableAmount + item.gstAmount;
                return (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-900">{p?.name ?? item.productId}</span>
                      {p?.hsn && <span className="text-xs text-slate-500 block">HSN: {p.hsn}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right">₹{item.rate.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {item.discount > 0 ? `₹${item.discount.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right">₹{item.taxableAmount.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">₹{item.gstAmount.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900">₹{amount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Summary & Totals */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 mb-6">
        <div className="w-full sm:w-auto sm:min-w-[340px]">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 px-4 text-slate-600">Subtotal</td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-900 w-28">₹{invoice.subtotal.toFixed(2)}</td>
                </tr>
                {invoice.discount > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 text-slate-600">Discount</td>
                    <td className="py-2.5 px-4 text-right font-medium text-green-600">- ₹{invoice.discount.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 px-4 text-slate-600">Taxable Amount</td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-900">₹{invoice.taxableAmount.toFixed(2)}</td>
                </tr>
                {invoice.cgstAmount > 0 && (
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td className="py-2 px-4 text-slate-500 text-sm pl-6">CGST</td>
                    <td className="py-2 px-4 text-right text-slate-600">₹{invoice.cgstAmount.toFixed(2)}</td>
                  </tr>
                )}
                {invoice.sgstAmount > 0 && (
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td className="py-2 px-4 text-slate-500 text-sm pl-6">SGST</td>
                    <td className="py-2 px-4 text-right text-slate-600">₹{invoice.sgstAmount.toFixed(2)}</td>
                  </tr>
                )}
                {invoice.igstAmount > 0 && (
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td className="py-2 px-4 text-slate-500 text-sm pl-6">IGST</td>
                    <td className="py-2 px-4 text-right text-slate-600">₹{invoice.igstAmount.toFixed(2)}</td>
                  </tr>
                )}
                {invoice.roundOff !== 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-4 text-slate-500">Round off</td>
                    <td className="py-2 px-4 text-right text-slate-600">
                      {invoice.roundOff >= 0 ? "+" : ""}₹{invoice.roundOff.toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-800 text-white">
                  <td className="py-3 px-4 font-bold text-base">Grand Total</td>
                  <td className="py-3 px-4 text-right font-bold text-lg">₹{invoice.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-slate-600 mt-3 text-right italic">
            {invoice.totalInWords}
          </p>
        </div>
      </div>

      {/* Bank Details */}
      <section className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-slate-800 rounded"></span>
          Bank Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-slate-500 m-0 text-xs uppercase">Bank Name</p>
            <p className="font-medium text-slate-900 m-0">{company?.bankName ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 m-0 text-xs uppercase">Account No</p>
            <p className="font-medium text-slate-900 m-0">{company?.bankAccount ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 m-0 text-xs uppercase">IFSC Code</p>
            <p className="font-medium text-slate-900 m-0">{company?.bankIfsc ?? "—"}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pt-6 border-t border-slate-200">
        <div>
          <p className="text-xs text-slate-500 m-0">
            This is a computer-generated invoice. Subject to terms and conditions of sale.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600 m-0 mb-8">For {company?.name ?? ""}</p>
          <p className="text-xs text-slate-500 m-0 border-t border-slate-300 pt-1 inline-block px-4">
            Authorised Signatory
          </p>
        </div>
      </footer>

      {/* Print controls */}
      <div className="no-print mt-8 flex gap-3 pt-6 border-t border-slate-200">
        <button type="button" onClick={() => window.print()} className="btn btn-primary">
          Print Invoice
        </button>
        <Link to={`/invoices/${id}`} className="btn btn-secondary no-underline">
          Back to invoice
        </Link>
      </div>
    </div>
  );
}
