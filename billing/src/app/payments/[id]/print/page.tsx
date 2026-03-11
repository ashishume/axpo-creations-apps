
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
  const customerId = payment?.customerId ?? "";
  const { data: customer } = useCustomer(customerId, { enabled: !!customerId });
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPaymentModeLabel = (mode: string) => {
    switch (mode) {
      case "cash": return "Cash";
      case "cheque": return "Cheque";
      case "online": return "Online / UPI / NEFT";
      default: return mode;
    }
  };

  return (
    <div className="print-area animate-fadeIn bg-white text-slate-900 p-6 sm:p-8 max-w-[210mm] mx-auto shadow-sm">
      {/* Header */}
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
              </p>
              {company?.phone && (
                <p className="m-0 text-slate-600">
                  <span className="font-medium">Ph:</span> {company.phone}
                </p>
              )}
            </div>
          </div>
          <div className="text-right sm:min-w-[200px]">
            <div className="inline-block bg-green-700 text-white px-4 py-2 rounded">
              <h2 className="text-lg font-bold uppercase tracking-wide m-0">
                Payment Receipt
              </h2>
            </div>
            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 text-slate-500 text-left">Receipt No</td>
                    <td className="py-2 px-3 font-bold text-slate-900 text-right">{payment.receiptNo}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-500 text-left">Date</td>
                    <td className="py-2 px-3 font-medium text-slate-900 text-right">{formatDate(payment.date)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </header>

      <hr className="border-slate-300 mb-6" />

      {/* Received From */}
      <section className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-green-700 rounded"></span>
          Received From
        </h3>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
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
            </>
          ) : (
            <p className="text-sm text-slate-500 italic m-0">Customer ID: {payment.customerId}</p>
          )}
        </div>
      </section>

      {/* Payment Amount - Large display */}
      <section className="mb-6 text-center p-6 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-700 uppercase font-medium tracking-wider m-0 mb-2">Amount Received</p>
        <p className="text-4xl font-bold text-green-800 m-0">₹{payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        <p className="text-sm text-green-600 mt-2 m-0 capitalize">
          Payment Mode: <span className="font-medium">{getPaymentModeLabel(payment.mode)}</span>
        </p>
      </section>

      {/* Payment Details */}
      <section className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-green-700 rounded"></span>
          Payment Details
        </h3>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-3 px-4 text-slate-600 w-40">Payment Mode</td>
                <td className="py-3 px-4 font-medium text-slate-900 capitalize">{getPaymentModeLabel(payment.mode)}</td>
              </tr>
              {payment.mode === "cheque" && (
                <>
                  {payment.chequeNo && (
                    <tr className="border-b border-slate-100">
                      <td className="py-2 px-4 text-slate-600">Cheque No</td>
                      <td className="py-2 px-4 font-medium">{payment.chequeNo}</td>
                    </tr>
                  )}
                  {payment.chequeDate && (
                    <tr className="border-b border-slate-100">
                      <td className="py-2 px-4 text-slate-600">Cheque Date</td>
                      <td className="py-2 px-4 font-medium">{formatDate(payment.chequeDate)}</td>
                    </tr>
                  )}
                  {payment.bankName && (
                    <tr className="border-b border-slate-100">
                      <td className="py-2 px-4 text-slate-600">Bank</td>
                      <td className="py-2 px-4 font-medium">{payment.bankName}</td>
                    </tr>
                  )}
                </>
              )}
              {payment.mode === "online" && payment.referenceNo && (
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-4 text-slate-600">Reference No / UTR</td>
                  <td className="py-2 px-4 font-medium font-mono">{payment.referenceNo}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invoice Allocations */}
      {allocationsList.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-green-700 rounded"></span>
            Adjusted Against Invoices
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left py-2.5 px-4 font-semibold text-slate-700">Invoice No</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-slate-700">Date</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-slate-700 w-32">Amount Adjusted</th>
                </tr>
              </thead>
              <tbody>
                {allocationsList.map((a) => {
                  const inv = getInvoice(a.invoiceId);
                  return (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="py-2.5 px-4 font-medium text-slate-900">{inv?.number ?? a.invoiceId}</td>
                      <td className="py-2.5 px-4 text-slate-600">{inv ? formatDate(inv.date) : "—"}</td>
                      <td className="py-2.5 px-4 text-right font-medium">₹{a.amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={2} className="py-2.5 px-4 font-semibold text-slate-700">Total Adjusted</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">₹{allocatedTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* Advance Balance */}
      {advance > 0 && (
        <section className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-amber-800 m-0">Advance / Balance Carried Forward</h3>
              <p className="text-xs text-amber-600 m-0 mt-1">This amount will be adjusted against future invoices</p>
            </div>
            <p className="text-2xl font-bold text-amber-800 m-0">₹{advance.toFixed(2)}</p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pt-6 border-t border-slate-200 mt-8">
        <div>
          <p className="text-xs text-slate-500 m-0">
            This is a computer-generated receipt. Thank you for your payment.
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
          Print Receipt
        </button>
        <Link to="/payments" className="btn btn-secondary no-underline">
          Back to payments
        </Link>
      </div>
    </div>
  );
}
