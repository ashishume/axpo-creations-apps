
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useCompany, useSuppliers, useProducts } from "@/hooks/useStore";
import {
  getNextPurchaseInvoiceSeqAsync,
  addPurchaseInvoiceAsync,
  addSupplierAsync,
} from "@/lib/store-async";
import { useBusinessMode } from "@/contexts/BusinessModeContext";
import { formatPurchaseInvoiceNumber } from "@/lib/invoice-number";
import { getGstAmounts, amountToWords, roundToRupee, getRoundOff } from "@/lib/gst";
import { RemoveIcon, Skeleton, TableSkeleton } from "@/components/ui";
import { AddSupplierModal } from "@/components/modals/AddSupplierModal";

interface LineRow {
  productId: string;
  quantity: number;
  rate: number;
  discount: number;
  lineTotal: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
}

const today = new Date().toISOString().slice(0, 10);

export function NewPurchaseInvoicePage() {
  const navigate = useNavigate();
  const { mode } = useBusinessMode();
  const { data: company, loading: companyLoading } = useCompany();
  const { data: suppliersData, loading: suppliersLoading, refetch: refetchSuppliers } = useSuppliers();
  const { data: productsData, loading: productsLoading } = useProducts();

  const fyStart = company?.financialYearStart ?? new Date().getFullYear();
  const [supplierId, setSupplierId] = useState("");
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [invDate, setInvDate] = useState(today);
  const [lines, setLines] = useState<LineRow[]>([]);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [saving, setSaving] = useState(false);

  const suppliers = useMemo(() => suppliersData ?? [], [suppliersData]);
  const products = useMemo(() => productsData ?? [], [productsData]);

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id) ?? null, [products]);

  const isIntrastate = useMemo(() => {
    if (!company?.stateCode || !supplierId) return true;
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup?.stateCode) return true;
    return company.stateCode === sup.stateCode;
  }, [company?.stateCode, supplierId, suppliers]);

  const lineCalcs = useMemo(() => {
    return lines.map((line) => {
      const lineTotalBeforeDiscount = line.quantity * line.rate;
      const afterDiscount = lineTotalBeforeDiscount - line.discount;
      const taxable = roundToRupee(afterDiscount);
      const { cgst, sgst, igst } = getGstAmounts(taxable, line.gstRate, isIntrastate);
      const gstAmount = cgst + sgst + igst;
      return { ...line, lineTotal: lineTotalBeforeDiscount, taxableAmount: taxable, gstAmount };
    });
  }, [lines, isIntrastate]);

  const subtotal = useMemo(() => lineCalcs.reduce((s, l) => s + l.quantity * l.rate, 0), [lineCalcs]);
  const totalLineDiscount = useMemo(() => lineCalcs.reduce((s, l) => s + l.discount, 0), [lineCalcs]);
  const totalDiscount = totalLineDiscount + invoiceDiscount;
  const taxableAmount = useMemo(
    () => lineCalcs.reduce((s, l) => s + l.taxableAmount, 0) - invoiceDiscount,
    [lineCalcs, invoiceDiscount]
  );
  const totalGst = useMemo(() => lineCalcs.reduce((s, l) => s + l.gstAmount, 0), [lineCalcs]);
  const totalBeforeRound = taxableAmount + totalGst;
  const roundOff = useMemo(() => getRoundOff(totalBeforeRound), [totalBeforeRound]);
  const grandTotal = roundToRupee(totalBeforeRound);
  const totalInWords = amountToWords(grandTotal);

  const addLine = () => {
    const product = products[0];
    if (!product) return;
    setLines([
      ...lines,
      {
        productId: product.id,
        quantity: 0,
        rate: product.costPrice ?? product.sellingPrice,
        discount: 0,
        lineTotal: 0,
        taxableAmount: 0,
        gstRate: product.gstRate,
        gstAmount: 0,
      },
    ]);
  };

  const updateLine = (idx: number, updates: Partial<LineRow>) => {
    const next = [...lines];
    next[idx] = { ...next[idx], ...updates };
    if ("productId" in updates && updates.productId) {
      const p = getProduct(updates.productId);
      if (p) {
        next[idx].rate = p.costPrice ?? p.sellingPrice;
        next[idx].gstRate = p.gstRate;
      }
    }
    setLines(next);
  };

  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!company) {
      alert("Please set up company profile first.");
      return;
    }
    if (!supplierId) {
      alert("Please select a supplier.");
      return;
    }
    if (lines.length === 0) {
      alert("Add at least one product line.");
      return;
    }
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].quantity <= 0) {
        alert(`Line ${i + 1}: Quantity must be greater than 0.`);
        return;
      }
    }

    setSaving(true);
    try {
      const seq = await getNextPurchaseInvoiceSeqAsync(fyStart, mode);
      const number = formatPurchaseInvoiceNumber(seq, fyStart);

      const cgstTotal = lineCalcs.reduce((s, l) => {
        const g = getGstAmounts(l.taxableAmount, l.gstRate, isIntrastate);
        return s + g.cgst;
      }, 0);
      const sgstTotal = lineCalcs.reduce((s, l) => {
        const g = getGstAmounts(l.taxableAmount, l.gstRate, isIntrastate);
        return s + g.sgst;
      }, 0);
      const igstTotal = lineCalcs.reduce((s, l) => {
        const g = getGstAmounts(l.taxableAmount, l.gstRate, isIntrastate);
        return s + g.igst;
      }, 0);

      const pi = await addPurchaseInvoiceAsync(
        {
          number,
          date: invDate,
          supplierId,
          subtotal,
          discount: totalDiscount,
          taxableAmount,
          cgstAmount: cgstTotal,
          sgstAmount: sgstTotal,
          igstAmount: igstTotal,
          roundOff,
          total: grandTotal,
          totalInWords,
          status: "final",
          businessType: mode,
        },
        lineCalcs.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          rate: l.rate,
          discount: l.discount,
          lineTotal: l.quantity * l.rate - l.discount,
          taxableAmount: l.taxableAmount,
          gstAmount: l.gstAmount,
        }))
      );

      navigate(`/purchase-invoices/${pi.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save purchase invoice.");
    } finally {
      setSaving(false);
    }
  };

  const loading = companyLoading || suppliersLoading || productsLoading;

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-4" />
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>New Purchase</h1>
        <p className="mt-2">
          Please <Link to="/setup">set up company profile</Link> first.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>New Purchase Invoice</h1>
      <p className="mt-2">
        <Link to="/purchase-invoices">← Back to list</Link>
      </p>

      <div className="card mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium" style={{ color: "var(--text-primary)" }}>Supplier *</label>
            <div className="flex gap-2">
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="input flex-1"
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} {s.phone ? `– ${s.phone}` : ""}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowAddSupplierModal(true)} className="btn btn-secondary shrink-0">
                Add supplier
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-2 font-medium" style={{ color: "var(--text-primary)" }}>Date</label>
            <input type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} className="input w-auto" />
          </div>
        </div>
      </div>

      <AddSupplierModal
        isOpen={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        onSaved={() => { refetchSuppliers(); setShowAddSupplierModal(false); }}
      />

      <div className="card mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Items</h2>
          <button type="button" onClick={addLine} className="btn btn-primary">
            + Add Product
          </button>
        </div>

        {lines.length > 0 && (
          <div className="table-container overflow-x-auto -mx-4 sm:mx-0">
            <table className="table min-w-[640px]">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Discount</th>
                  <th>Taxable</th>
                  <th>GST</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lineCalcs.map((line, idx) => {
                  const p = getProduct(line.productId);
                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          value={line.productId}
                          onChange={(e) => updateLine(idx, { productId: e.target.value })}
                          className="input min-w-[140px]"
                        >
                          {products.map((pr) => (
                            <option key={pr.id} value={pr.id}>{pr.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={line.quantity || ""}
                          onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 0 })}
                          className="input w-20"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.rate || ""}
                          onChange={(e) => updateLine(idx, { rate: Number(e.target.value) || 0 })}
                          className="input w-24"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.discount || ""}
                          onChange={(e) => updateLine(idx, { discount: Number(e.target.value) || 0 })}
                          className="input w-20"
                        />
                      </td>
                      <td>₹{line.taxableAmount.toFixed(2)}</td>
                      <td>₹{line.gstAmount.toFixed(2)}</td>
                      <td>
                        <button type="button" onClick={() => removeLine(idx)} className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30" title="Remove line">
                          <RemoveIcon size={16} style={{ color: "var(--btn-danger)" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 space-y-2 max-w-xs ml-auto">
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Discount</span>
            <span>₹{totalDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Taxable</span>
            <span>₹{taxableAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>GST</span>
            <span>₹{totalGst.toFixed(2)}</span>
          </div>
          {roundOff !== 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Round off</span>
              <span>₹{roundOff.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <span>Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={handleSave} className="btn btn-primary" disabled={saving || lines.length === 0}>
            {saving ? "Saving…" : "Save purchase invoice"}
          </button>
          <Link to="/purchase-invoices" className="btn btn-secondary no-underline">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
