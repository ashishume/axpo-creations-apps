import { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import {
  useCompany,
  useCustomers,
  useInvoices,
  usePaymentAllocations,
} from "@/hooks/useStore";
import {
  getCompanyAsync,
  addPaymentAsync,
  getNextReceiptSeqAsync,
} from "@/lib/store-async";
import { formatReceiptNumber } from "@/lib/invoice-number";
import { Modal, Skeleton } from "@/components/ui";

const today = new Date().toISOString().slice(0, 10);

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function NewPaymentModal({ isOpen, onClose, onSaved }: NewPaymentModalProps) {
  const { data: company, loading: companyLoading } = useCompany();
  const { data: customersData, loading: customersLoading } = useCustomers();
  const { data: invoicesData } = useInvoices();
  const { data: allocationsData } = usePaymentAllocations();

  const customers = customersData ?? [];
  const invoices = invoicesData ?? [];
  const allocations = allocationsData ?? [];

  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState(0);
  const [mode, setMode] = useState<"cash" | "cheque" | "online">("cash");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [amountAgainstInvoices, setAmountAgainstInvoices] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const fyStart = company?.financialYearStart ?? new Date().getFullYear();

  const customerInvoices = useMemo(() => {
    if (!customerId) return [];
    return invoices.filter((inv) => inv.customerId === customerId && inv.status === "final");
  }, [customerId, invoices]);

  const totalAgainstInvoices = useMemo(
    () => Object.values(amountAgainstInvoices).reduce((s, a) => s + a, 0),
    [amountAgainstInvoices]
  );
  const advance = Math.max(0, amount - totalAgainstInvoices);

  const outstandingByInvoice = useMemo(() => {
    const map: Record<string, number> = {};
    customerInvoices.forEach((inv) => {
      const paid = allocations
        .filter((a) => a.invoiceId === inv.id)
        .reduce((s, a) => s + a.amount, 0);
      map[inv.id] = inv.total - paid;
    });
    return map;
  }, [customerInvoices, allocations]);

  const handleSave = async () => {
    const companyData = await getCompanyAsync();
    if (!companyData) { alert("Set up company profile first."); return; }
    if (!customerId) { alert("Select a customer."); return; }
    if (amount <= 0) { alert("Amount must be greater than 0."); return; }
    if (totalAgainstInvoices > amount) {
      alert(`Total allocated (₹${totalAgainstInvoices.toFixed(2)}) cannot exceed payment (₹${amount.toFixed(2)}).`);
      return;
    }
    for (const [invoiceId, allocatedAmt] of Object.entries(amountAgainstInvoices)) {
      if (allocatedAmt <= 0) continue;
      const outstanding = outstandingByInvoice[invoiceId] ?? 0;
      if (allocatedAmt > outstanding) {
        const inv = customerInvoices.find((i) => i.id === invoiceId);
        alert(`Amount for invoice ${inv?.number || invoiceId} exceeds outstanding ₹${outstanding.toFixed(2)}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const seq = await getNextReceiptSeqAsync(fyStart);
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
          mode,
          chequeNo: mode === "cheque" ? chequeNo : "",
          chequeDate: mode === "cheque" ? chequeDate : "",
          bankName: mode === "cheque" ? bankName : "",
          referenceNo: mode === "online" ? referenceNo : "",
        },
        allocationList
      );
      setCustomerId(""); setDate(today); setAmount(0); setMode("cash");
      setChequeNo(""); setChequeDate(""); setBankName(""); setReferenceNo("");
      setAmountAgainstInvoices({});
      onSaved();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save payment.");
    } finally {
      setSaving(false);
    }
  };

  const loading = companyLoading || customersLoading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Payment" size="xl">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !company ? (
        <p style={{ color: "var(--text-secondary)" }}>Set up company profile first.</p>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
          className="space-y-4 max-h-[65vh] overflow-y-auto pr-1"
        >
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Customer *</label>
            <select
              value={customerId}
              onChange={(e) => { setCustomerId(e.target.value); setAmountAgainstInvoices({}); }}
              className="input"
              required
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} – {c.phone} ({c.customerType})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Date *</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Amount (₹) *</label>
              <input type="number" className="input" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value) || 0)} min={0.01} step={0.01} required />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Payment mode</label>
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value as "cash" | "cheque" | "online")}>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online (NEFT/UPI)</option>
            </select>
          </div>
          {mode === "cheque" && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Cheque No</label>
                <input type="text" className="input" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Cheque Date</label>
                <input type="date" className="input" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Bank Name</label>
                <input type="text" className="input" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
            </div>
          )}
          {mode === "online" && (
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Reference No</label>
              <input type="text" className="input" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
            </div>
          )}

          {customerId && customerInvoices.length > 0 && (
            <div className="border rounded-lg p-4" style={{ borderColor: "var(--border)" }}>
              <strong className="text-sm" style={{ color: "var(--text-primary)" }}>Apply to invoices (optional)</strong>
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Rest will be advance.</p>
              <div className="table-container mt-2 overflow-x-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Remaining</th>
                      <th>Apply (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInvoices.map((inv) => {
                      const out = outstandingByInvoice[inv.id] ?? inv.total;
                      if (out <= 0) return null;
                      const allocated = amountAgainstInvoices[inv.id] ?? 0;
                      const exceeds = allocated > out;
                      return (
                        <tr key={inv.id} className={exceeds ? "bg-red-50 dark:bg-red-900/20" : ""}>
                          <td>{inv.number}</td>
                          <td>₹{out.toFixed(2)}</td>
                          <td>
                            <input
                              type="number"
                              value={amountAgainstInvoices[inv.id] ?? ""}
                              onChange={(e) => setAmountAgainstInvoices({ ...amountAgainstInvoices, [inv.id]: Number(e.target.value) || 0 })}
                              className={`input w-24 ${exceeds ? "border-red-500" : ""}`}
                              min={0}
                              max={out}
                              step={0.01}
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-4 text-sm mt-3 p-3 rounded-lg" style={{ background: "var(--table-row-alt)" }}>
                <span>Applied: <strong>₹{totalAgainstInvoices.toFixed(2)}</strong></span>
                <span>Advance: <strong>₹{advance.toFixed(2)}</strong></span>
                {totalAgainstInvoices > amount && (
                  <span className="flex items-center gap-1.5 text-red-600">
                    <AlertTriangle className="h-4 w-4" /> Exceeds payment
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={totalAgainstInvoices > amount || saving}>
              {saving ? "Saving..." : "Save payment"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
