
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
  const { data: customer, loading: customerLoading } = useCustomer(invoice?.customerId ?? "");
  const { data: company, loading: companyLoading } = useCompany();
  const { data: products } = useProducts();

  const loading = invoiceLoading || itemsLoading || customerLoading || companyLoading;

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

  return (
    <div className="print-area animate-fadeIn bg-white text-slate-900 p-6 sm:p-8 max-w-[210mm] mx-auto">
      {/* Header: Company + Invoice title */}
      <header className="border-b-2 border-slate-800 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            {company?.logoPath && (
              <img src={company.logoPath} alt="Logo" className="h-14 mb-3 object-contain" />
            )}
            <h1 className="text-xl font-bold text-slate-900 m-0">{company?.name ?? ""}</h1>
            <p className="text-sm text-slate-600 mt-1 mb-0 leading-snug">{company?.address ?? ""}</p>
            <p className="text-sm text-slate-600 mt-0.5 mb-0">
              GSTIN: <span className="font-medium text-slate-800">{company?.gstin ?? ""}</span>
              {company?.pan && (
                <> &nbsp;| PAN: <span className="font-medium text-slate-800">{company.pan}</span></>
              )}
            </p>
            <p className="text-sm text-slate-600 mt-0.5 mb-0">
              Ph: {company?.phone ?? ""} &nbsp; {company?.email && <>| {company.email}</>}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 m-0 border-b-2 border-slate-800 pb-1 inline-block">
              Tax Invoice
            </h2>
            <div className="mt-3 text-sm space-y-0.5">
              <p className="m-0"><span className="text-slate-500">Invoice No:</span> <strong>{invoice.number}</strong></p>
              <p className="m-0"><span className="text-slate-500">Date:</span> <strong>{invoice.date}</strong></p>
            </div>
          </div>
        </div>
      </header>

      {/* Bill To */}
      <section className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Bill To</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="font-semibold text-slate-900 m-0">{customer?.name ?? ""}</p>
          {customer?.billingAddress && (
            <p className="text-sm text-slate-600 mt-1 mb-0 leading-snug">{customer.billingAddress}</p>
          )}
          {customer?.gstin && (
            <p className="text-sm text-slate-600 mt-0.5 mb-0">GSTIN: {customer.gstin}</p>
          )}
          {customer?.stateCode && (
            <p className="text-sm text-slate-600 mt-0 mb-0">State Code: {customer.stateCode}</p>
          )}
        </div>
      </section>

      {/* Line items table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="text-left py-2.5 px-3 font-semibold w-8">#</th>
              <th className="text-left py-2.5 px-3 font-semibold">Particulars</th>
              <th className="text-right py-2.5 px-3 font-semibold w-20">Qty</th>
              <th className="text-right py-2.5 px-3 font-semibold w-24">Rate</th>
              <th className="text-right py-2.5 px-3 font-semibold w-24">Discount</th>
              <th className="text-right py-2.5 px-3 font-semibold w-24">Taxable</th>
              <th className="text-right py-2.5 px-3 font-semibold w-24">GST</th>
              <th className="text-right py-2.5 px-3 font-semibold w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item, idx) => {
              const p = productMap.get(item.productId);
              const amount = item.taxableAmount + item.gstAmount;
              return (
                <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-slate-600">{idx + 1}</td>
                  <td className="py-2 px-3 font-medium">{p?.name ?? item.productId}</td>
                  <td className="py-2 px-3 text-right">{item.quantity}</td>
                  <td className="py-2 px-3 text-right">₹{item.rate.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">₹{item.discount.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">₹{item.taxableAmount.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">₹{item.gstAmount.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-medium">₹{amount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mt-4">
        <div className="w-full max-w-[320px] border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2 px-4 text-slate-600">Subtotal</td>
                <td className="py-2 px-4 text-right font-medium">₹{invoice.subtotal.toFixed(2)}</td>
              </tr>
              {invoice.discount > 0 && (
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-4 text-slate-600">Discount</td>
                  <td className="py-2 px-4 text-right font-medium">- ₹{invoice.discount.toFixed(2)}</td>
                </tr>
              )}
              <tr className="border-b border-slate-200">
                <td className="py-2 px-4 text-slate-600">Taxable Amount</td>
                <td className="py-2 px-4 text-right font-medium">₹{invoice.taxableAmount.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 px-4 text-slate-600">CGST / SGST / IGST</td>
                <td className="py-2 px-4 text-right">
                  ₹{invoice.cgstAmount.toFixed(2)} / ₹{invoice.sgstAmount.toFixed(2)} / ₹{invoice.igstAmount.toFixed(2)}
                </td>
              </tr>
              {invoice.roundOff !== 0 && (
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-4 text-slate-600">Round off</td>
                  <td className="py-2 px-4 text-right font-medium">₹{invoice.roundOff.toFixed(2)}</td>
                </tr>
              )}
              <tr className="bg-slate-100">
                <td className="py-3 px-4 font-bold text-slate-900">Grand Total</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900 text-base">₹{invoice.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-slate-600 mt-3 text-center font-medium">Amount in words: {invoice.totalInWords}</p>

      {/* Bank & footer */}
      <footer className="mt-8 pt-4 border-t border-slate-200 text-sm text-slate-600">
        <p className="m-0">
          <span className="font-medium text-slate-700">Bank:</span> {company?.bankName ?? "—"} &nbsp;
          <span className="font-medium text-slate-700">A/c:</span> {company?.bankAccount ?? "—"} &nbsp;
          <span className="font-medium text-slate-700">IFSC:</span> {company?.bankIfsc ?? "—"}
        </p>
        <p className="mt-2 text-xs text-slate-500 m-0">
          This is a computer-generated invoice. Subject to terms and conditions of sale.
        </p>
      </footer>

      <div className="no-print mt-8 flex gap-3">
        <button type="button" onClick={() => window.print()} className="btn btn-primary">
          Print
        </button>
        <Link to={`/invoices/${id}`} className="btn btn-secondary no-underline">
          Back to invoice
        </Link>
      </div>
    </div>
  );
}
