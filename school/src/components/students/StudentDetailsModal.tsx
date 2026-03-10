import { useState, useRef, useEffect, useMemo } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { FormField } from "../ui/FormField";
import type { Student, StudentClass, PaymentMethod, StudentPersonalDetails } from "../../types";
import { formatCurrency, formatDate, formatMonthYear } from "../../lib/utils";
import { 
  getTotalPaid, 
  getRemaining, 
  getPaymentStatus, 
  getTotalFine,
  getTargetAmount,
  getPaymentsByCategory,
  getRunningBalances,
  getDiscountedMonthlyFees,
  getSiblingDiscount,
  getNextUnpaidMonth,
} from "../../lib/studentUtils";
import { cn } from "../../lib/utils";
import { User, Phone, MapPin, Heart, AlertTriangle, DollarSign, Camera, X, Image } from "lucide-react";

interface StudentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  student: Student;
  studentClass?: StudentClass;
  initialTab?: "overview" | "fees" | "personal" | "payments";
  onAddPayment?: (payment: { 
    date: string; 
    amount: number; 
    method: PaymentMethod; 
    receiptNumber: string;
    feeCategory: "registration" | "admission" | "annualFund" | "monthly" | "transport" | "other";
    month?: string;
    receiptPhotoUrl?: string;
  }) => void | Promise<void>;
  onUpdateStudent?: (data: Partial<Student>) => void;
}

const statusColors = {
  "Fully Paid": "bg-green-100 text-green-800",
  "Partially Paid": "bg-amber-100 text-amber-800",
  "Not Paid": "bg-red-100 text-red-800",
};

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export function StudentDetailsModal({ 
  open, 
  onClose, 
  student, 
  studentClass,
  initialTab = "overview",
  onAddPayment,
  onUpdateStudent
}: StudentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "fees" | "personal" | "payments">(initialTab);
  const [showPaymentForm, setShowPaymentForm] = useState(initialTab === "payments");
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [receiptPhotoPreview, setReceiptPhotoPreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("monthly");
  const [paymentMonth, setPaymentMonth] = useState<string>(() => getNextUnpaidMonth(student, "monthly"));
  const amountInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  
  // Reset state when student changes (payment list refresh fix)
  useEffect(() => {
    setShowPaymentForm(initialTab === "payments");
  }, [student.id, student.payments.length, initialTab]);

  // When form is shown or category changes, set "For Month" to next unpaid month for that category
  const nextUnpaidMonth = getNextUnpaidMonth(student, "monthly");
  const nextUnpaidMonthTransport = getNextUnpaidMonth(student, "transport");
  // Months for "For Month" dropdown: 12 back to 12 ahead (readable labels)
  const monthOptions = useMemo(() => {
    const out: string[] = [];
    const now = new Date();
    for (let i = -12; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return out;
  }, []);
  useEffect(() => {
    if (!showPaymentForm) return;
    setPaymentMonth(selectedCategory === "transport" ? nextUnpaidMonthTransport : nextUnpaidMonth);
  }, [showPaymentForm, selectedCategory, nextUnpaidMonth, nextUnpaidMonthTransport]);
  // Reset month when student changes (e.g. after recording a payment we update the student in parent)
  useEffect(() => {
    setPaymentMonth(getNextUnpaidMonth(student, selectedCategory === "transport" ? "transport" : "monthly"));
  }, [student.id, student.payments.length, selectedCategory]);

  const target = getTargetAmount(student, studentClass);
  const paid = getTotalPaid(student);
  const remaining = getRemaining(student, studentClass);
  const fine = getTotalFine(student, studentClass);
  const status = getPaymentStatus(student, studentClass);
  const paidByCategory = getPaymentsByCategory(student);
  const balances = getRunningBalances(student, studentClass);

  // Fee structure (from student or class)
  const registrationFees = student.registrationFees ?? studentClass?.registrationFees ?? 0;
  const admissionFees = student.admissionFees ?? studentClass?.admissionFees ?? 0;
  const annualFund = student.annualFund ?? studentClass?.annualFund ?? 0;
  const baseMonthlyFees = student.monthlyFees ?? studentClass?.monthlyFees ?? 0;
  const monthlyFees = getDiscountedMonthlyFees(student, studentClass); // Apply sibling discount if applicable
  const siblingDiscount = getSiblingDiscount(student);
  const transportFees = student.transportFees ?? 0;

  // Handle fee category change to pre-fill amount
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (!amountInputRef.current) return;
    
    let prefillAmount = 0;
    switch (category) {
      case "registration":
        prefillAmount = registrationFees;
        break;
      case "admission":
        prefillAmount = admissionFees;
        break;
      case "annualFund":
        prefillAmount = annualFund;
        break;
      case "monthly":
        prefillAmount = monthlyFees;
        break;
      case "transport":
        prefillAmount = transportFees;
        break;
      default:
        prefillAmount = 0;
    }
    
    if (prefillAmount > 0) {
      amountInputRef.current.value = String(prefillAmount);
    }
  };

  // Handle receipt photo selection with 2MB limit
  const handleReceiptPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptPhotoPreview(null);
      return;
    }
    
    // Check file size (2MB = 2 * 1024 * 1024 bytes)
    if (file.size > 2 * 1024 * 1024) {
      alert("Receipt photo must be under 2MB. Please select a smaller file.");
      e.target.value = "";
      setReceiptPhotoPreview(null);
      return;
    }
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onAddPayment) return;
    const form = e.currentTarget;
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value);
    const method = (form.elements.namedItem("method") as HTMLSelectElement).value as PaymentMethod;
    const receiptNumber = (form.elements.namedItem("receiptNumber") as HTMLInputElement).value.trim();
    const feeCategory = (form.elements.namedItem("feeCategory") as HTMLSelectElement).value as "registration" | "admission" | "annualFund" | "monthly" | "transport" | "other";
    const month = (form.elements.namedItem("month") as HTMLInputElement)?.value;
    
    if (!date || amount <= 0) return;
    
    // TODO: Upload receipt photo and get URL (currently using base64 preview for demo)
    const receiptPhotoUrl = receiptPhotoPreview || undefined;
    
    await onAddPayment({ 
      date, 
      amount, 
      method, 
      receiptNumber: receiptNumber || "-",
      feeCategory,
      month: (feeCategory === "monthly" || feeCategory === "transport") ? month : undefined,
      receiptPhotoUrl
    });
    setShowPaymentForm(false);
    setReceiptPhotoPreview(null);
    setSelectedCategory("monthly");
  };

  const handlePersonalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onUpdateStudent) return;
    const form = e.currentTarget;
    
    onUpdateStudent({
      personalDetails: {
        fatherName: (form.elements.namedItem("fatherName") as HTMLInputElement).value.trim() || undefined,
        motherName: (form.elements.namedItem("motherName") as HTMLInputElement).value.trim() || undefined,
        guardianPhone: (form.elements.namedItem("guardianPhone") as HTMLInputElement).value.trim() || undefined,
        currentAddress: (form.elements.namedItem("currentAddress") as HTMLTextAreaElement).value.trim() || undefined,
        permanentAddress: (form.elements.namedItem("permanentAddress") as HTMLTextAreaElement).value.trim() || undefined,
        bloodGroup: (form.elements.namedItem("bloodGroup") as HTMLSelectElement).value as StudentPersonalDetails["bloodGroup"] || "",
        healthIssues: (form.elements.namedItem("healthIssues") as HTMLTextAreaElement).value.trim() || undefined,
      }
    });
    setEditingPersonal(false);
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "fees", label: "Fee Structure" },
    { id: "personal", label: "Personal Info" },
    { id: "payments", label: "Payments" },
  ] as const;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Student Details – ${student.name}`}
    >
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                activeTab === tab.id 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Student Photo and Basic Info */}
            <div className="flex items-start gap-4">
              {student.photoUrl ? (
                <img 
                  src={student.photoUrl} 
                  alt={student.name} 
                  className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="h-10 w-10 text-slate-400" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                <div>
                  <span className="text-slate-500">Student ID:</span>
                  <p className="font-medium">{student.studentId}</p>
                </div>
                <div>
                  <span className="text-slate-500">Class:</span>
                  <p className="font-medium">{studentClass?.name ?? "Not assigned"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Fee Type:</span>
                  <p className="font-medium">{student.feeType}</p>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs font-medium", statusColors[status])}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-slate-50 p-4">
              <h4 className="font-medium text-slate-900 mb-3">Fee Summary</h4>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-slate-600">Total Annual Fees:</div>
                <div className="font-medium text-right">{formatCurrency(target)}</div>
                <div className="text-slate-600">Total Paid:</div>
                <div className="font-medium text-right text-green-600">{formatCurrency(paid)}</div>
                <div className="text-slate-600">Remaining:</div>
                <div className="font-medium text-right">{formatCurrency(remaining)}</div>
                {fine > 0 && (
                  <>
                    <div className="text-slate-600">Late Fee:</div>
                    <div className="font-medium text-right text-red-600">{formatCurrency(fine)}</div>
                    <div className="text-slate-600 font-medium">Total Due:</div>
                    <div className="font-bold text-right">{formatCurrency(remaining + fine)}</div>
                  </>
                )}
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn(
                    "h-full rounded-full",
                    status === "Fully Paid" ? "bg-green-500" : status === "Partially Paid" ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(100, (paid / target) * 100)}%` }}
                />
              </div>
            </div>

            {/* Quick Personal Info */}
            {student.personalDetails && (
              <div className="rounded-lg border border-slate-200 p-4 text-sm space-y-2">
                <h4 className="font-medium text-slate-900 flex items-center gap-2">
                  <User className="h-4 w-4" /> Quick Info
                </h4>
                {student.personalDetails.guardianPhone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {student.personalDetails.guardianPhone}
                  </p>
                )}
                {student.personalDetails.bloodGroup && (
                  <p className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-red-400" />
                    Blood Group: {student.personalDetails.bloodGroup}
                  </p>
                )}
                {student.personalDetails.healthIssues && (
                  <p className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {student.personalDetails.healthIssues}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Fee Structure Tab */}
        {activeTab === "fees" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <h4 className="font-medium text-slate-900 mb-3">Fee Breakdown</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2">Fee Type</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Paid</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-200">
                    <td className="py-2">Registration Fee (one-time)</td>
                    <td className="py-2 text-right">{formatCurrency(registrationFees)}</td>
                    <td className="py-2 text-right text-green-600">{formatCurrency(paidByCategory.registration)}</td>
                    <td className="py-2 text-right">
                      {student.registrationPaid || paidByCategory.registration >= registrationFees ? "✓" : "—"}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-200">
                    <td className="py-2">Admission Fee (one-time)</td>
                    <td className="py-2 text-right">{formatCurrency(admissionFees)}</td>
                    <td className="py-2 text-right text-green-600">{formatCurrency(paidByCategory.admission)}</td>
                    <td className="py-2 text-right">
                      {student.admissionPaid || paidByCategory.admission >= admissionFees ? "✓" : "—"}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-200">
                    <td className="py-2">Annual Fund (one-time)</td>
                    <td className="py-2 text-right">{formatCurrency(annualFund)}</td>
                    <td className="py-2 text-right text-green-600">{formatCurrency(paidByCategory.annualFund)}</td>
                    <td className="py-2 text-right">
                      {student.annualFundPaid || paidByCategory.annualFund >= annualFund ? "✓" : "—"}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-200">
                    <td className="py-2">
                      Monthly Tuition (× 12)
                      {siblingDiscount > 0 && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          30% sibling discount
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {siblingDiscount > 0 && (
                        <span className="text-slate-400 line-through mr-1 text-xs">
                          {formatCurrency(baseMonthlyFees)}
                        </span>
                      )}
                      {formatCurrency(monthlyFees)} / month
                    </td>
                    <td className="py-2 text-right text-green-600">{formatCurrency(paidByCategory.monthly)}</td>
                    <td className="py-2 text-right">
                      {paidByCategory.monthly >= monthlyFees * 12 ? "✓" : `${Math.floor(paidByCategory.monthly / (monthlyFees || 1))}/12`}
                    </td>
                  </tr>
                  {transportFees > 0 && (
                    <tr className="border-t border-slate-200">
                      <td className="py-2">Transport Fee (× 12)</td>
                      <td className="py-2 text-right">{formatCurrency(transportFees)} / month</td>
                      <td className="py-2 text-right text-green-600">{formatCurrency(paidByCategory.transport)}</td>
                      <td className="py-2 text-right">
                        {paidByCategory.transport >= transportFees * 12 ? "✓" : `${Math.floor(paidByCategory.transport / transportFees)}/12`}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 font-medium">
                    <td className="pt-2">Total Annual</td>
                    <td className="pt-2 text-right">{formatCurrency(target)}</td>
                    <td className="pt-2 text-right text-green-600">{formatCurrency(paid)}</td>
                    <td className="pt-2 text-right">{Math.round((paid / target) * 100)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 text-sm">
              <h4 className="font-medium text-slate-900 mb-2">Late Fee Configuration</h4>
              <p>Due day: {student.dueDayOfMonth ?? studentClass?.dueDayOfMonth ?? 10}th of each month</p>
              <p>Late fee: {formatCurrency(student.lateFeeAmount ?? studentClass?.lateFeeAmount ?? 0)} per {student.lateFeeFrequency ?? studentClass?.lateFeeFrequency ?? "week"}</p>
            </div>
          </div>
        )}

        {/* Personal Info Tab */}
        {activeTab === "personal" && (
          <div className="space-y-4">
            {editingPersonal ? (
              <form onSubmit={handlePersonalSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Father's Name">
                    <Input name="fatherName" type="text" defaultValue={student.personalDetails?.fatherName} />
                  </FormField>
                  <FormField label="Mother's Name">
                    <Input name="motherName" type="text" defaultValue={student.personalDetails?.motherName} />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Guardian Phone">
                    <Input name="guardianPhone" type="tel" defaultValue={student.personalDetails?.guardianPhone} />
                  </FormField>
                  <FormField label="Blood Group">
                    <Select name="bloodGroup" defaultValue={student.personalDetails?.bloodGroup ?? ""}>
                      <option value="">Select</option>
                      {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </Select>
                  </FormField>
                </div>
                <FormField label="Current Address">
                  <Textarea name="currentAddress" rows={2} defaultValue={student.personalDetails?.currentAddress} />
                </FormField>
                <FormField label="Permanent Address">
                  <Textarea name="permanentAddress" rows={2} defaultValue={student.personalDetails?.permanentAddress} />
                </FormField>
                <FormField label="Health Issues (if any)">
                  <Textarea
                    name="healthIssues"
                    rows={2}
                    defaultValue={student.personalDetails?.healthIssues}
                    placeholder="Any allergies, medical conditions, etc."
                  />
                </FormField>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setEditingPersonal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-slate-900">Personal Details</h4>
                  {onUpdateStudent && (
                    <Button size="sm" variant="secondary" onClick={() => setEditingPersonal(true)}>
                      Edit
                    </Button>
                  )}
                </div>
                
                <div className="rounded-lg bg-slate-50 p-4 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500">Father's Name:</span>
                      <p className="font-medium">{student.personalDetails?.fatherName || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Mother's Name:</span>
                      <p className="font-medium">{student.personalDetails?.motherName || "—"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Guardian Phone:</span>
                    <span className="font-medium">{student.personalDetails?.guardianPhone || "—"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-400" />
                    <span className="text-slate-500">Blood Group:</span>
                    <span className="font-medium">{student.personalDetails?.bloodGroup || "—"}</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-slate-500">Current Address:</span>
                      <p className="font-medium">{student.personalDetails?.currentAddress || "—"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="text-slate-500">Permanent Address:</span>
                      <p className="font-medium">{student.personalDetails?.permanentAddress || "—"}</p>
                    </div>
                  </div>
                  
                  {student.personalDetails?.healthIssues && (
                    <div className="flex items-start gap-2 p-2 bg-amber-50 rounded border border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <span className="text-amber-800 font-medium">Health Issues:</span>
                        <p className="text-amber-700">{student.personalDetails.healthIssues}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-slate-900">Payment History</h4>
              {onAddPayment && (
                <Button size="sm" onClick={() => setShowPaymentForm(true)}>
                  <DollarSign className="mr-1 h-4 w-4" /> Add Payment
                </Button>
              )}
            </div>
            
            {showPaymentForm && (
              <form
                key={`payment-form-${paymentMonth}`}
                onSubmit={handlePaymentSubmit}
                className="rounded-lg border border-slate-200 p-4 space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Fee Category *" required>
                    <Select
                      name="feeCategory"
                      required
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="rounded px-2 py-1.5 text-sm"
                    >
                      <option value="monthly">Monthly Tuition ({formatCurrency(monthlyFees)}{siblingDiscount > 0 ? " - 30% off" : ""})</option>
                      <option value="registration">Registration Fee ({formatCurrency(registrationFees)})</option>
                      <option value="admission">Admission Fee ({formatCurrency(admissionFees)})</option>
                      <option value="annualFund">Annual Fund ({formatCurrency(annualFund)})</option>
                      {transportFees > 0 && (
                        <option value="transport">Transport Fee ({formatCurrency(transportFees)})</option>
                      )}
                      <option value="other">Other</option>
                    </Select>
                  </FormField>
                  <FormField label="Amount (₹) *" required helperText="Amount auto-fills based on category">
                    <Input
                      ref={amountInputRef}
                      name="amount"
                      type="number"
                      required
                      min={1}
                      defaultValue={monthlyFees > 0 ? monthlyFees : ""}
                      className="rounded px-2 py-1.5 text-sm"
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Date *" required>
                    <Input
                      name="date"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="rounded px-2 py-1.5 text-sm"
                    />
                  </FormField>
                  <FormField
                    label="For Month"
                    helperText={selectedCategory === "monthly" || selectedCategory === "transport"
                      ? "Defaults to next unpaid month"
                      : "Leave empty for one-time fees"}
                  >
                    <Select
                      name="month"
                      value={paymentMonth}
                      onChange={(e) => setPaymentMonth(e.target.value)}
                      className="rounded px-2 py-1.5 text-sm"
                    >
                      {monthOptions.map((m) => (
                        <option key={m} value={m}>
                          {formatMonthYear(m)}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Method">
                    <Select name="method" className="rounded px-2 py-1.5 text-sm">
                      <option value="Cash">Cash</option>
                      <option value="Online">Online</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </Select>
                  </FormField>
                  <FormField label="Receipt #">
                    <Input name="receiptNumber" type="text" className="rounded px-2 py-1.5 text-sm" />
                  </FormField>
                </div>
                
                {/* Receipt Photo Upload */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Receipt Photo (Max 2MB)</label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={receiptInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptPhotoChange}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="secondary"
                      onClick={() => receiptInputRef.current?.click()}
                    >
                      <Camera className="mr-1 h-4 w-4" />
                      {receiptPhotoPreview ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {receiptPhotoPreview && (
                      <div className="relative">
                        <img 
                          src={receiptPhotoPreview} 
                          alt="Receipt preview" 
                          className="h-16 w-16 object-cover rounded border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptPhotoPreview(null);
                            if (receiptInputRef.current) receiptInputRef.current.value = "";
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => {
                    setShowPaymentForm(false);
                    setReceiptPhotoPreview(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">Record Payment</Button>
                </div>
              </form>
            )}

            {student.payments.length === 0 ? (
              <p className="text-sm text-slate-500">No payments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-600">
                      <th className="pb-2 pr-2 font-medium">Date</th>
                      <th className="pb-2 pr-2 font-medium">Category</th>
                      <th className="pb-2 pr-2 font-medium">Amount</th>
                      <th className="pb-2 pr-2 font-medium">Method</th>
                      <th className="pb-2 pr-2 font-medium">Receipt</th>
                      <th className="pb-2 pr-2 font-medium">Photo</th>
                      <th className="pb-2 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map(({ afterPayment, payment }) => (
                      <tr key={payment.id} className="border-b border-slate-100">
                        <td className="py-1.5 pr-2">{formatDate(payment.date)}</td>
                        <td className="py-1.5 pr-2 capitalize">{payment.feeCategory ?? "—"}</td>
                        <td className="py-1.5 pr-2 text-green-600">{formatCurrency(payment.amount)}</td>
                        <td className="py-1.5 pr-2">{payment.method}</td>
                        <td className="py-1.5 pr-2">{payment.receiptNumber}</td>
                        <td className="py-1.5 pr-2">
                          {payment.receiptPhotoUrl ? (
                            <a 
                              href={payment.receiptPhotoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                            >
                              <Image className="h-3.5 w-3.5" />
                              View
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-1.5">{formatCurrency(afterPayment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
