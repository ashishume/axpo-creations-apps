
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  useCompany,
  useCustomers,
  useProducts,
} from "@/hooks/useStore";
import {
  getNextInvoiceSeqAsync,
  addInvoiceAsync,
  addStockMovementAsync,
  addCustomerAsync,
} from "@/lib/store-async";
import { useBusinessMode } from "@/contexts/BusinessModeContext";
import { formatInvoiceNumber } from "@/lib/invoice-number";
import { getGstAmounts, amountToWords, roundToRupee, getRoundOff } from "@/lib/gst";
import type { CustomerType } from "@/lib/db/types";
import { AlertTriangle } from "lucide-react";
import { RemoveIcon, Spinner, TableSkeleton, Skeleton } from "@/components/ui";

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
const CUSTOMER_TYPES: CustomerType[] = ["Dealer", "Contractor", "Retail", "Builder"];

export function NewInvoicePage() {
  const navigate = useNavigate();
  const { mode } = useBusinessMode();
  const { data: company, loading: companyLoading } = useCompany();
  const { data: customersData, loading: customersLoading, refetch: refetchCustomers } = useCustomers();
  const { data: productsData, loading: productsLoading } = useProducts();

  const fyStart = company?.financialYearStart ?? new Date().getFullYear();
  const [customerChoice, setCustomerChoice] = useState<"existing" | "new">("new");
  const [customerId, setCustomerId] = useState("");
  const [invDate, setInvDate] = useState(today);
  const [lines, setLines] = useState<LineRow[]>([]);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const customers = useMemo(() => customersData ?? [], [customersData]);
  const products = useMemo(() => productsData ?? [], [productsData]);

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id) ?? null,
    [products]
  );

  const [newCustName, setNewCustName] = useState("");
  const [newCustType, setNewCustType] = useState<CustomerType>("Dealer");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustGstin, setNewCustGstin] = useState("");
  const [newCustBilling, setNewCustBilling] = useState("");
  const [newCustShipping, setNewCustShipping] = useState("");
  const [newCustStateCode, setNewCustStateCode] = useState("");

  const isIntrastate = useMemo(() => {
    if (!company?.stateCode || !customerId) return true;
    const cust = customers.find((c) => c.id === customerId);
    if (!cust?.stateCode) return true;
    return company.stateCode === cust.stateCode;
  }, [company?.stateCode, customerId, customers]);

  const lineCalcs = useMemo(() => {
    return lines.map((line) => {
      const lineTotalBeforeDiscount = line.quantity * line.rate;
      const afterDiscount = lineTotalBeforeDiscount - line.discount;
      const taxable = roundToRupee(afterDiscount);
      const { cgst, sgst, igst } = getGstAmounts(taxable, line.gstRate, isIntrastate);
      const gstAmount = cgst + sgst + igst;
      return {
        ...line,
        lineTotal: lineTotalBeforeDiscount,
        taxableAmount: taxable,
        gstAmount,
      };
    });
  }, [lines, isIntrastate]);

  // Check for stock issues
  const stockIssues = useMemo(() => {
    return lineCalcs
      .map((line, idx) => {
        const p = getProduct(line.productId);
        if (p && p.currentStock < line.quantity && line.quantity > 0) {
          return { idx, productName: p.name, available: p.currentStock, requested: line.quantity };
        }
        return null;
      })
      .filter(Boolean);
  }, [lineCalcs, getProduct]);

  const subtotal = useMemo(
    () => lineCalcs.reduce((s, l) => s + l.quantity * l.rate, 0),
    [lineCalcs]
  );
  const totalLineDiscount = useMemo(
    () => lineCalcs.reduce((s, l) => s + l.discount, 0),
    [lineCalcs]
  );
  const totalDiscount = totalLineDiscount + invoiceDiscount;
  const taxableAmount = useMemo(
    () => lineCalcs.reduce((s, l) => s + l.taxableAmount, 0) - invoiceDiscount,
    [lineCalcs, invoiceDiscount]
  );
  const totalGst = useMemo(
    () => lineCalcs.reduce((s, l) => s + l.gstAmount, 0),
    [lineCalcs]
  );
  const totalBeforeRound = taxableAmount + totalGst;
  const roundOff = useMemo(() => getRoundOff(totalBeforeRound), [totalBeforeRound]);
  const grandTotal = roundToRupee(totalBeforeRound);
  const totalInWords = amountToWords(grandTotal);

  const addLine = () => {
    const availableProduct = products.find((p) => p.currentStock > 0) || products[0];
    if (!availableProduct) return;
    setLines([
      ...lines,
      {
        productId: availableProduct.id,
        quantity: 0,
        rate: availableProduct.sellingPrice,
        discount: 0,
        lineTotal: 0,
        taxableAmount: 0,
        gstRate: availableProduct.gstRate,
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
        next[idx].rate = p.sellingPrice;
        next[idx].gstRate = p.gstRate;
      }
    }
    setLines(next);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const saveNewCustomer = async () => {
    if (!newCustName.trim()) {
      alert("Customer name is required.");
      return;
    }
    setSavingCustomer(true);
    try {
      const c = await addCustomerAsync({
        name: newCustName.trim(),
        customerType: newCustType,
        phone: newCustPhone.trim(),
        gstin: newCustGstin.trim(),
        billingAddress: newCustBilling.trim(),
        shippingAddress: newCustShipping.trim() || newCustBilling.trim(),
        openingBalance: 0,
        creditDays: 0,
        creditLimit: 0,
        stateCode: newCustStateCode.trim(),
        businessType: mode,
      });
      await refetchCustomers();
      setCustomerId(c.id);
      setCustomerChoice("existing");
      setNewCustName("");
      setNewCustPhone("");
      setNewCustGstin("");
      setNewCustBilling("");
      setNewCustShipping("");
      setNewCustStateCode("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add customer.");
    } finally {
      setSavingCustomer(false);
    }
  };

  const clearNewCustomerForm = () => {
    setNewCustName("");
    setNewCustType("Dealer");
    setNewCustPhone("");
    setNewCustGstin("");
    setNewCustBilling("");
    setNewCustShipping("");
    setNewCustStateCode("");
  };

  const handleSave = async () => {
    if (!company) {
      alert("Please set up company profile first.");
      return;
    }
    if (!customerId) {
      alert("Please select or add a customer.");
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
      const p = getProduct(lines[i].productId);
      if (p && p.currentStock < lines[i].quantity) {
        alert(`Insufficient stock for ${p.name}. Available: ${p.currentStock}`);
        return;
      }
    }

    setSaving(true);
    try {
      const seq = await getNextInvoiceSeqAsync(fyStart, mode);
      const number = formatInvoiceNumber(seq, fyStart);

      const inv = await addInvoiceAsync(
        {
          number,
          date: invDate,
          customerId,
          subtotal,
          discount: totalDiscount,
          taxableAmount,
          cgstAmount: lineCalcs.reduce((s, l) => {
            const g = getGstAmounts(l.taxableAmount, l.gstRate, isIntrastate);
            return s + g.cgst;
          }, 0),
          sgstAmount: lineCalcs.reduce((s, l) => {
            const g = getGstAmounts(l.taxableAmount, l.gstRate, isIntrastate);
            return s + g.sgst;
          }, 0),
          igstAmount: lineCalcs.reduce((s, l) => {
            const g = getGstAmounts(l.taxableAmount, l.gstRate, isIntrastate);
            return s + g.igst;
          }, 0),
          roundOff,
          total: grandTotal,
          totalInWords,
          status: "final",
          cancelReason: "",
          businessType: mode,
        },
        lineCalcs.map((l) => {
          const p = getProduct(l.productId);
          return {
            productId: l.productId,
            quantity: l.quantity,
            rate: l.rate,
            costPrice: p?.costPrice ?? 0,
            discount: l.discount,
            lineTotal: l.quantity * l.rate - l.discount,
            taxableAmount: l.taxableAmount,
            gstAmount: l.gstAmount,
          };
        })
      );

      for (const l of lineCalcs) {
        await addStockMovementAsync({
          date: invDate,
          productId: l.productId,
          quantity: -l.quantity,
          type: "sale",
          referenceId: inv.id,
          remarks: `Invoice ${number}`,
          businessType: mode,
        });
      }

      navigate(`/invoices/${inv.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save invoice.");
    } finally {
      setSaving(false);
    }
  };

  const loading = companyLoading || customersLoading || productsLoading;

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          New Invoice
        </h1>
        <div className="mt-4">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="card mt-4 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-10 w-full" count={3} />
        </div>
        <div className="card mt-6">
          <TableSkeleton rows={5} cols={7} />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          New Invoice
        </h1>
        <p className="mt-2" style={{ color: "var(--text-primary)" }}>
          Please <Link to="/setup">set up company profile</Link> first.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        New Invoice
      </h1>
      <p className="mt-2">
        <Link to="/invoices" className="no-underline hover:no-underline">
          ← Back to list
        </Link>
      </p>

      <div className="card mt-4">
        <div className="flex items-center justify-between mb-4">
          <label className="font-medium" style={{ color: "var(--text-primary)" }}>
            Customer *
          </label>
          <div className="flex rounded-lg bg-slate-200 p-1">
            <button
              type="button"
              onClick={() => {
                setCustomerChoice("new");
                setCustomerId("");
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${customerChoice === "new"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              New Customer
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomerChoice("existing");
                clearNewCustomerForm();
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${customerChoice === "existing"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Existing Customer
            </button>

          </div>
        </div>

        {customerChoice === "existing" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium" style={{ color: "var(--text-primary)" }}>
                Select Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="input"
              >
                <option value="">Select customer (name, phone, type)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} – {c.phone} ({c.customerType})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm">
                <Link to="/customers" className="no-underline">Manage customers</Link>
              </p>
            </div>
            <div>
              <label className="block mb-2 font-medium" style={{ color: "var(--text-primary)" }}>
                Invoice Date
              </label>
              <input
                type="date"
                value={invDate}
                onChange={(e) => setInvDate(e.target.value)}
                className="input w-auto"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="input"
                  placeholder="Customer name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="input"
                  placeholder="Phone number"
                />
              </div>
              {/* <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Type
                </label>
                <select
                  value={newCustType}
                  onChange={(e) => setNewCustType(e.target.value as CustomerType)}
                  className="input"
                >
                  {CUSTOMER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div> */}
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invDate}
                  onChange={(e) => setInvDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  GSTIN
                </label>
                <input
                  type="text"
                  value={newCustGstin}
                  onChange={(e) => setNewCustGstin(e.target.value.toUpperCase())}
                  className="input"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  State Code
                </label>
                <input
                  type="text"
                  value={newCustStateCode}
                  onChange={(e) => setNewCustStateCode(e.target.value)}
                  className="input"
                  placeholder="e.g. 09"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Billing Address
                </label>
                <input
                  type="text"
                  value={newCustBilling}
                  onChange={(e) => setNewCustBilling(e.target.value)}
                  className="input"
                  placeholder="Address"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Shipping Address
                </label>
                <input
                  type="text"
                  value={newCustShipping}
                  onChange={(e) => setNewCustShipping(e.target.value)}
                  className="input"
                  placeholder="Same as billing if empty"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={saveNewCustomer}
                className="btn btn-primary"
                disabled={savingCustomer || !newCustName.trim()}
              >
                {savingCustomer ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" />
                    Saving...
                  </span>
                ) : (
                  "Save & Continue"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerChoice("existing");
                  clearNewCustomerForm();
                }}
                className="btn btn-secondary"
                disabled={savingCustomer}
              >
                Cancel
              </button>
              {!newCustName.trim() && !newCustPhone.trim() && (
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Enter name and phone to save
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stock warning */}
      {stockIssues.length > 0 && (
        <div
          className="card mt-4 border-l-4"
          style={{ borderLeftColor: "var(--btn-danger)", background: "var(--warning-bg)" }}
        >
          <p className="flex items-center gap-2 font-medium" style={{ color: "var(--warning-text)" }}>
            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
            Stock issues detected:
          </p>
          <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--warning-text)" }}>
            {stockIssues.map((issue) => (
              <li key={issue!.idx}>
                {issue!.productName}: Requested {issue!.requested}, but only {issue!.available} available
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Items table */}
      <div className="card mt-6">
        <div className="flex justify-between items-center mb-4">
          <strong style={{ color: "var(--text-primary)" }}>Items</strong>
          <button type="button" onClick={addLine} className="btn btn-primary">
            + Add Product
          </button>
        </div>
        <div className="table-container border-0">
          <table className="table">
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
              {lineCalcs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: "var(--text-secondary)" }}>
                    No items added yet. Click &quot;Add Line&quot; to add products.
                  </td>
                </tr>
              )}
              {lineCalcs.map((line, idx) => {
                const product = getProduct(line.productId);
                const hasStockIssue = product && product.currentStock < line.quantity && line.quantity > 0;
                return (
                  <tr key={idx} className={hasStockIssue ? "bg-red-50 dark:bg-red-900/20" : ""}>
                    <td>
                      <select
                        value={line.productId}
                        onChange={(e) => updateLine(idx, { productId: e.target.value })}
                        className="input w-full min-w-[180px] py-1.5"
                      >
                        {products.map((pr) => (
                          <option
                            key={pr.id}
                            value={pr.id}
                            disabled={pr.currentStock <= 0}
                          >
                            {pr.name} (Stock: {pr.currentStock})
                          </option>
                        ))}
                      </select>
                      {hasStockIssue && product && (
                        <span className="text-xs text-red-600 block mt-1">
                          Only {product.currentStock} available
                        </span>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        value={line.quantity || ""}
                        onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 0 })}
                        className="input w-[80px] py-1.5"
                        min={1}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={line.rate || ""}
                        onChange={(e) => updateLine(idx, { rate: Number(e.target.value) || 0 })}
                        className="input w-[90px] py-1.5"
                        min={0}
                        step={0.01}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={line.discount || ""}
                        onChange={(e) => updateLine(idx, { discount: Number(e.target.value) || 0 })}
                        className="input w-[80px] py-1.5"
                        min={0}
                      />
                    </td>
                    <td style={{ color: "var(--text-primary)" }}>{line.taxableAmount.toFixed(2)}</td>
                    <td style={{ color: "var(--text-primary)" }}>{line.gstAmount.toFixed(2)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        style={{ color: "var(--btn-danger)" }}
                        title="Remove line"
                      >
                        <RemoveIcon size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="card mt-6 max-w-[350px] ml-auto">
        <div className="space-y-2">
          <div className="flex justify-between" style={{ color: "var(--text-primary)" }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {totalLineDiscount > 0 && (
            <div className="flex justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
              <span>Line discounts</span>
              <span>- ₹{totalLineDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center" style={{ color: "var(--text-primary)" }}>
            <span>Additional Discount</span>
            <input
              type="number"
              value={invoiceDiscount || ""}
              onChange={(e) => setInvoiceDiscount(Number(e.target.value) || 0)}
              className="input w-24 py-1.5 text-right"
              min={0}
            />
          </div>
          <div className="flex justify-between" style={{ color: "var(--text-primary)" }}>
            <span>Taxable</span>
            <span>₹{taxableAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between" style={{ color: "var(--text-primary)" }}>
            <span>GST</span>
            <span>₹{totalGst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
            <span>Round off</span>
            <span>{roundOff >= 0 ? "+" : ""}₹{roundOff.toFixed(2)}</span>
          </div>
          <div
            className="flex justify-between py-2 font-bold border-t mt-2"
            style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
          >
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {totalInWords}
          </p>
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6">
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
          disabled={stockIssues.length > 0 || saving}
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" />
              Saving...
            </span>
          ) : (
            "Save Invoice"
          )}
        </button>
        {stockIssues.length > 0 && (
          <span className="ml-3 text-sm" style={{ color: "var(--btn-danger)" }}>
            Fix stock issues before saving
          </span>
        )}
      </div>
    </div>
  );
}
