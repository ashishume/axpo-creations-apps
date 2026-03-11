
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import {
  useCompany,
  useCustomers,
  useInvoices,
  usePaymentAllocations,
  usePayments,
} from "@/hooks/useStore";
import {
  getCompanyAsync,
  addPaymentAsync,
  getNextReceiptSeqAsync,
} from "@/lib/store-async";
import { useBusinessMode } from "@/contexts/BusinessModeContext";
import { formatReceiptNumber } from "@/lib/invoice-number";
import { Skeleton } from "@/components/ui";

const today = new Date().toISOString().slice(0, 10);

export function NewPaymentPage() {
  const navigate = useNavigate();
  const { mode: businessMode } = useBusinessMode();
  const { data: company, loading: companyLoading } = useCompany();
  const { data: customers = [], loading: customersLoading } = useCustomers();
  const { data: invoices = [] } = useInvoices();
  const { data: allocations = [] } = usePaymentAllocations();
  const { data: payments = [] } = usePayments();

  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<"cash" | "cheque" | "online">("cash");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [amountAgainstInvoices, setAmountAgainstInvoices] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const fyStart = company?.financialYearStart ?? new Date().getFullYear();

  const customerInvoices = useMemo(() => {
    if (!customerId) return [];
    return (invoices ?? []).filter((inv) => inv.customerId === customerId && inv.status === "final");
  }, [customerId, invoices]);

  const totalAgainstInvoices = useMemo(
    () => Object.values(amountAgainstInvoices).reduce((s, a) => s + a, 0),
    [amountAgainstInvoices]
  );
  const advance = Math.max(0, amount - totalAgainstInvoices);

  const outstandingByInvoice = useMemo(() => {
    const map: Record<string, number> = {};
    const allocList = allocations ?? [];
    customerInvoices.forEach((inv) => {
      const paid = allocList
        .filter((a) => a.invoiceId === inv.id)
        .reduce((s, a) => s + a.amount, 0);
      map[inv.id] = inv.total - paid;
    });
    return map;
  }, [customerInvoices, allocations]);

  const previousPayments = useMemo(() => {
    if (!customerId) return [];
    return (payments ?? [])
      .filter((p) => p.customerId === customerId)
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 20);
  }, [customerId, payments]);

  const handleSave = async () => {
    const companyData = await getCompanyAsync(businessMode);
    if (!companyData) {
      alert("Set up company profile first.");
      return;
    }
    if (!customerId) {
      alert("Select a customer.");
      return;
    }
    if (amount <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }

    // Validate: Total allocated should not exceed payment amount
    if (totalAgainstInvoices > amount) {
      alert(
        `Total allocated to invoices (₹${totalAgainstInvoices.toFixed(2)}) cannot exceed payment amount (₹${amount.toFixed(2)}).`
      );
      return;
    }

    // Validate: Each allocation should not exceed outstanding for that invoice
    for (const [invoiceId, allocatedAmt] of Object.entries(amountAgainstInvoices)) {
      if (allocatedAmt <= 0) continue;
      const outstanding = outstandingByInvoice[invoiceId] ?? 0;
      if (allocatedAmt > outstanding) {
        const inv = customerInvoices.find((i) => i.id === invoiceId);
        alert(
          `Amount allocated to invoice ${inv?.number || invoiceId} (₹${allocatedAmt.toFixed(2)}) exceeds outstanding (₹${outstanding.toFixed(2)}).`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const seq = await getNextReceiptSeqAsync(fyStart, businessMode);
      const receiptNo = formatReceiptNumber(seq, fyStart);
      const allocationList = Object.entries(amountAgainstInvoices)
        .filter(([, amt]) => amt > 0)
        .map(([invoiceId, amt]) => ({ invoiceId, amount: amt }));

      await addPaymentAsync(
        {
          receiptNo,
          date,
          customerId,
          amount,
          mode: paymentMode,
          chequeNo: paymentMode === "cheque" ? chequeNo : "",
          chequeDate: paymentMode === "cheque" ? chequeDate : "",
          bankName: paymentMode === "cheque" ? bankName : "",
          referenceNo: paymentMode === "online" ? referenceNo : "",
          businessType: businessMode,
        },
        allocationList
      );
      navigate("/payments");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save payment.");
    } finally {
      setSaving(false);
    }
  };

  const loading = companyLoading || customersLoading;

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-64 mt-2" />
        <div className="mt-6 space-y-4 max-w-[520px]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="animate-fadeIn">
        <h1>New Payment</h1>
        <p>
          <Link to="/setup">Set up company profile</Link> first.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1>New Payment</h1>
      <p className="mt-2">
        <Link to="/payments">Back to list</Link>
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="max-w-[520px] mt-4"
      >
        <div className="mb-4">
          <label className="block mb-1">Customer *</label>
          <select
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setAmountAgainstInvoices({});
            }}
            className="input"
            required
          >
            <option value="">Select customer</option>
            {(customers ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} – {c.phone} ({c.customerType})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">Date *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Amount received *</label>
          <input
            type="number"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="input"
            min={0.01}
            step={0.01}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Payment mode</label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as "cash" | "cheque" | "online")}
            className="input"
          >
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online (NEFT/UPI)</option>
          </select>
        </div>
        {paymentMode === "cheque" && (
          <>
            <div className="mb-4">
              <label className="block mb-1">Cheque No</label>
              <input type="text" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} className="input" />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Cheque Date</label>
              <input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} className="input" />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Bank Name</label>
              <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="input" />
            </div>
          </>
        )}
        {paymentMode === "online" && (
          <div className="mb-4">
            <label className="block mb-1">Reference No</label>
            <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className="input" />
          </div>
        )}

        {customerId && customerInvoices.length > 0 && (
          <div className="mt-6">
            <strong>Apply this payment to invoices (optional)</strong>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Enter how much of the amount received goes toward each unpaid invoice. Rest will be advance.
            </p>
            <div className="table-container mt-2">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Total</th>
                    <th>Remaining</th>
                    <th>Amount to apply</th>
                  </tr>
                </thead>
                <tbody>
                  {customerInvoices.map((inv) => {
                    const out = outstandingByInvoice[inv.id] ?? inv.total;
                    if (out <= 0) return null;
                    const allocated = amountAgainstInvoices[inv.id] ?? 0;
                    const exceedsOutstanding = allocated > out;
                    return (
                      <tr key={inv.id} className={exceedsOutstanding ? "bg-red-50 dark:bg-red-900/20" : ""}>
                        <td>{inv.number}</td>
                        <td>₹ {inv.total.toFixed(2)}</td>
                        <td>₹ {out.toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            value={amountAgainstInvoices[inv.id] ?? ""}
                            onChange={(e) =>
                              setAmountAgainstInvoices({ ...amountAgainstInvoices, [inv.id]: Number(e.target.value) || 0 })
                            }
                            className={`input w-[100px] ${exceedsOutstanding ? "border-red-500" : ""}`}
                            min={0}
                            max={out}
                            step={0.01}
                            placeholder="0"
                          />
                          {exceedsOutstanding && (
                            <span className="text-xs text-red-600 block mt-1">Exceeds remaining</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-3 rounded-lg" style={{ background: "var(--table-row-alt)" }}>
              <div className="flex flex-wrap gap-4 text-sm">
                <span style={{ color: "var(--text-primary)" }}>
                  Applied to invoices: <strong>₹{totalAgainstInvoices.toFixed(2)}</strong>
                </span>
                <span style={{ color: "var(--text-primary)" }}>
                  Advance: <strong>₹{advance.toFixed(2)}</strong>
                </span>
              </div>
              {totalAgainstInvoices > amount && (
                <p className="flex items-center gap-1.5 text-red-600 text-sm mt-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                  Total allocated (₹{totalAgainstInvoices.toFixed(2)}) exceeds payment amount (₹{amount.toFixed(2)})
                </p>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary mt-4"
          disabled={totalAgainstInvoices > amount || saving}
        >
          {saving ? "Saving..." : "Save payment"}
        </button>
      </form>

      {customerId && previousPayments.length > 0 && (
        <div className="mt-8 max-w-[520px]">
          <h3 className="mb-2">Previous payments by this customer</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Receipt No</th>
                  <th>Amount</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody>
                {previousPayments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.date}</td>
                    <td>{p.receiptNo}</td>
                    <td>₹ {p.amount.toFixed(2)}</td>
                    <td>{p.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
