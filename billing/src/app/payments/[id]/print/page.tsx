
import { useParams, Link } from "react-router-dom";
import {
  usePayment,
  usePaymentAllocations,
  useCustomer,
  useCompany,
  useInvoices,
} from "@/hooks/useStore";
import { Skeleton } from "@/components/ui";

export function PrintPaymentPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: payment, loading: paymentLoading } = usePayment(id);
  const { data: allocations = [], loading: allocationsLoading } = usePaymentAllocations(id);
  const { data: customer } = useCustomer(payment?.customerId ?? "");
  const { data: company } = useCompany();
  const { data: invoices = [] } = useInvoices();

  const loading = paymentLoading || allocationsLoading;

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div>
        <p>Payment not found.</p>
        <Link to="/payments">Back</Link>
      </div>
    );
  }

  const allocationsList = allocations ?? [];
  const allocatedTotal = allocationsList.reduce((s, a) => s + a.amount, 0);
  const advance = payment.amount - allocatedTotal;
  const invoiceList = invoices ?? [];
  const getInvoice = (invoiceId: string) => invoiceList.find((inv) => inv.id === invoiceId);

  return (
    <div className="print-area animate-fadeIn bg-white text-slate-900 p-6 sm:p-8 max-w-[210mm] mx-auto">
      {/* Header */}
      <header className="border-b-2 border-slate-800 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            {company?.logoPath && (
              <img src={company.logoPath} alt="Logo" className="h-14 mb-3 object-contain" />
            )}
            <h1 className="text-xl font-bold text-slate-900 m-0">{company?.name ?? ""}</h1>
            <p className="text-sm text-slate-600 mt-1 mb-0 leading-snug">{company?.address ?? ""}</p>
            <p className="text-sm text-slate-600 mt-0.5 mb-0">GSTIN: {company?.gstin ?? ""}</p>
            {company?.phone && <p className="text-sm text-slate-600 mt-0 mb-0">Ph: {company.phone}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 m-0 border-b-2 border-slate-800 pb-1 inline-block">
              Payment Receipt
            </h2>
            <div className="mt-3 text-sm space-y-0.5">
              <p className="m-0"><span className="text-slate-500">Receipt No:</span> <strong>{payment.receiptNo}</strong></p>
              <p className="m-0"><span className="text-slate-500">Date:</span> <strong>{payment.date}</strong></p>
            </div>
          </div>
        </div>
      </header>

      {/* Received from */}
      <section className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Received From</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="font-semibold text-slate-900 m-0">{customer?.name ?? payment.customerId}</p>
          {customer?.billingAddress && (
            <p className="text-sm text-slate-600 mt-1 mb-0 leading-snug">{customer.billingAddress}</p>
          )}
        </div>
      </section>

      {/* Payment details */}
      <section className="border border-slate-200 rounded-lg overflow-hidden mb-6">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <td className="py-3 px-4 text-slate-600 font-medium w-40">Amount</td>
              <td className="py-3 px-4 font-bold text-lg text-slate-900">₹{payment.amount.toFixed(2)}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2 px-4 text-slate-600">Mode</td>
              <td className="py-2 px-4 font-medium capitalize">{payment.mode}</td>
            </tr>
            {payment.mode === "cheque" && (payment.chequeNo || payment.bankName) && (
              <>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-4 text-slate-600">Cheque No</td>
                  <td className="py-2 px-4">{payment.chequeNo ?? "—"}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-4 text-slate-600">Cheque Date</td>
                  <td className="py-2 px-4">{payment.chequeDate ?? "—"}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-4 text-slate-600">Bank</td>
                  <td className="py-2 px-4">{payment.bankName ?? "—"}</td>
                </tr>
              </>
            )}
            {payment.mode === "online" && payment.referenceNo && (
              <tr className="border-b border-slate-200">
                <td className="py-2 px-4 text-slate-600">Reference No</td>
                <td className="py-2 px-4">{payment.referenceNo}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Allocations */}
      {allocationsList.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Adjusted Against Invoices</h3>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full border-collapse text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left py-2.5 px-4 font-semibold">Invoice No</th>
                  <th className="text-right py-2.5 px-4 font-semibold w-32">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {allocationsList.map((a) => {
                  const inv = getInvoice(a.invoiceId);
                  return (
                    <tr key={a.id} className="border-b border-slate-200 last:border-0">
                      <td className="py-2 px-4 font-medium">{inv?.number ?? a.invoiceId}</td>
                      <td className="py-2 px-4 text-right">₹{a.amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {advance > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="m-0 text-sm">
            <span className="font-medium text-slate-700">Advance / Balance carried forward:</span>{" "}
            <strong className="text-slate-900">₹{advance.toFixed(2)}</strong>
          </p>
        </div>
      )}

      <footer className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <p className="text-sm text-slate-500 m-0">
          This is a computer-generated receipt. Thank you for your payment.
        </p>
        <div className="flex flex-col items-start sm:items-end">
          <p className="text-sm text-slate-600 m-0">Authorised Signature</p>
          <p className="text-xs text-slate-400 mt-6 m-0">_________________________</p>
        </div>
      </footer>

      <div className="no-print mt-8 flex gap-3">
        <button type="button" onClick={() => window.print()} className="btn btn-primary">
          Print
        </button>
        <Link to="/payments" className="btn btn-secondary no-underline">
          Back to payments
        </Link>
      </div>
    </div>
  );
}
