import { useState, useRef, useEffect, useMemo } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { FormField } from "../ui/FormField";
import type { SessionStudent, StudentClass, PaymentMethod, StudentPersonalDetails } from "../../types";
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
  getFeeHistoryMonths,
  getMonthlyPaymentStatus,
  getOneTimeFeePayments,
  getOtherPayments,
} from "../../lib/studentUtils";
import { cn } from "../../lib/utils";
import { User, Phone, MapPin, Heart, AlertTriangle, DollarSign, Camera, X, Image, CheckCircle, XCircle, AlertCircle, Plus, Trash2, Loader2, Snowflake, Lock } from "lucide-react";
import type { Session } from "../../types";

interface PaymentEntry {
  date: string;
  amount: number;
  method: PaymentMethod;
  receiptNumber: string;
  feeCategory: "registration" | "admission" | "annualFund" | "monthly" | "transport" | "other";
  month?: string;
  receiptPhotoUrl?: string;
}

interface SplitPaymentEntry {
  id: string;
  amount: number;
  method: PaymentMethod;
}

interface StudentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  student: SessionStudent;
  studentClass?: StudentClass;
  session?: Session;
  initialTab?: "overview" | "fees" | "personal" | "payments" | "feeHistory";
  onAddPayment?: (payment: PaymentEntry) => void | Promise<void>;
  onUpdateStudent?: (data: Partial<SessionStudent>) => void;
  onPaymentSuccess?: () => void;
  onFreezeAccount?: (freeze: boolean) => void | Promise<void>;
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
  session,
  initialTab = "overview",
  onAddPayment,
  onUpdateStudent,
  onPaymentSuccess,
  onFreezeAccount,
}: StudentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "fees" | "personal" | "payments" | "feeHistory">(initialTab);
  const [showPaymentForm, setShowPaymentForm] = useState(initialTab === "payments");
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [receiptPhotoPreview, setReceiptPhotoPreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("monthly");
  const [paymentMonth, setPaymentMonth] = useState<string>(() => getNextUnpaidMonth(student, "monthly"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPaymentEntry[]>([
    { id: "1", amount: 0, method: "Cash" },
    { id: "2", amount: 0, method: "Online" },
  ]);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  
  // Reset state when student changes (payment list refresh fix)
  useEffect(() => {
    setShowPaymentForm(initialTab === "payments");
  }, [student.id, student.payments.length, initialTab]);

  // Get session months for dropdown (only unpaid months)
  const sessionMonthOptions = useMemo(() => {
    if (!session) return [];
    const months = getFeeHistoryMonths(session.startDate, session.endDate);
    return months;
  }, [session]);

  // Get paid months for filtering
  const paidMonthlyMonths = useMemo(() => {
    return new Set(student.payments.filter(p => p.feeCategory === "monthly" && p.month).map(p => p.month!));
  }, [student.payments]);
  
  const paidTransportMonths = useMemo(() => {
    return new Set(student.payments.filter(p => p.feeCategory === "transport" && p.month).map(p => p.month!));
  }, [student.payments]);

  // Filter months based on category - only show unpaid months
  const availableMonthOptions = useMemo(() => {
    const paidMonths = selectedCategory === "transport" ? paidTransportMonths : paidMonthlyMonths;
    return sessionMonthOptions.filter(m => !paidMonths.has(m));
  }, [sessionMonthOptions, selectedCategory, paidMonthlyMonths, paidTransportMonths]);

  // When form is shown or category changes, set "For Month" to first available unpaid month
  const nextUnpaidMonth = getNextUnpaidMonth(student, "monthly");
  const nextUnpaidMonthTransport = getNextUnpaidMonth(student, "transport");
  
  useEffect(() => {
    if (!showPaymentForm) return;
    const targetMonth = selectedCategory === "transport" ? nextUnpaidMonthTransport : nextUnpaidMonth;
    if (availableMonthOptions.includes(targetMonth)) {
      setPaymentMonth(targetMonth);
    } else if (availableMonthOptions.length > 0) {
      setPaymentMonth(availableMonthOptions[0]);
    }
  }, [showPaymentForm, selectedCategory, nextUnpaidMonth, nextUnpaidMonthTransport, availableMonthOptions]);
  
  // Reset month when student changes (e.g. after recording a payment we update the student in parent)
  useEffect(() => {
    const targetMonth = getNextUnpaidMonth(student, selectedCategory === "transport" ? "transport" : "monthly");
    if (availableMonthOptions.includes(targetMonth)) {
      setPaymentMonth(targetMonth);
    } else if (availableMonthOptions.length > 0) {
      setPaymentMonth(availableMonthOptions[0]);
    }
  }, [student.id, student.payments.length, selectedCategory, availableMonthOptions]);

  // Navigate to payments with prefilled category and month
  const goToPaymentWithPrefill = (category: string, month?: string) => {
    setSelectedCategory(category);
    if (month) {
      setPaymentMonth(month);
    }
    setActiveTab("payments");
    
    // Prefill amount after state update
    setTimeout(() => {
      if (amountInputRef.current) {
        let amount = 0;
        switch (category) {
          case "registration": amount = student.registrationFees ?? studentClass?.registrationFees ?? 0; break;
          case "annualFund": amount = student.annualFund ?? studentClass?.annualFund ?? 0; break;
          case "monthly": amount = getDiscountedMonthlyFees(student, studentClass); break;
          case "transport": amount = student.transportFees ?? 0; break;
        }
        if (amount > 0) amountInputRef.current.value = String(amount);
      }
    }, 50);
  };

  const target = getTargetAmount(student, studentClass);
  const paid = getTotalPaid(student);
  const remaining = getRemaining(student, studentClass);
  const fine = getTotalFine(student, studentClass);
  const status = getPaymentStatus(student, studentClass);
  const paidByCategory = getPaymentsByCategory(student);
  const balances = getRunningBalances(student, studentClass);

  // Fee structure (from student or class)
  const registrationFees = student.registrationFees ?? studentClass?.registrationFees ?? 0;  // Registration/Admission fees (one-time)
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
        prefillAmount = registrationFees;  // Registration/Admission fees
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
    if (!onAddPayment || isSubmitting) return;
    
    const form = e.currentTarget;
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    const receiptNumber = (form.elements.namedItem("receiptNumber") as HTMLInputElement).value.trim();
    const feeCategory = (form.elements.namedItem("feeCategory") as HTMLSelectElement).value as "registration" | "admission" | "annualFund" | "monthly" | "transport" | "other";
    const month = (form.elements.namedItem("month") as HTMLInputElement)?.value;
    const receiptPhotoUrl = receiptPhotoPreview || undefined;
    
    if (!date) return;
    
    setIsSubmitting(true);
    
    try {
      if (isSplitPayment) {
        const validSplitPayments = splitPayments.filter(sp => sp.amount > 0);
        if (validSplitPayments.length === 0) {
          setIsSubmitting(false);
          return;
        }
        
        for (const sp of validSplitPayments) {
          await onAddPayment({
            date,
            amount: sp.amount,
            method: sp.method,
            receiptNumber: receiptNumber || "-",
            feeCategory,
            month: (feeCategory === "monthly" || feeCategory === "transport") ? month : undefined,
            receiptPhotoUrl,
          });
        }
      } else {
        const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value);
        const method = (form.elements.namedItem("method") as HTMLSelectElement).value as PaymentMethod;
        
        if (amount <= 0) {
          setIsSubmitting(false);
          return;
        }
        
        await onAddPayment({
          date,
          amount,
          method,
          receiptNumber: receiptNumber || "-",
          feeCategory,
          month: (feeCategory === "monthly" || feeCategory === "transport") ? month : undefined,
          receiptPhotoUrl,
        });
      }
      
      setShowPaymentForm(false);
      setReceiptPhotoPreview(null);
      setIsSplitPayment(false);
      setSplitPayments([
        { id: "1", amount: 0, method: "Cash" },
        { id: "2", amount: 0, method: "Online" },
      ]);
      
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      setSelectedCategory("monthly");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onUpdateStudent) return;
    const form = e.currentTarget;
    
    const aadhaarValue = (form.elements.namedItem("aadhaarNumber") as HTMLInputElement).value.trim();
    if (aadhaarValue && !/^\d{12}$/.test(aadhaarValue)) {
      alert("Aadhaar number must be exactly 12 digits");
      return;
    }
    
    onUpdateStudent({
      personalDetails: {
        fatherName: (form.elements.namedItem("fatherName") as HTMLInputElement).value.trim() || undefined,
        motherName: (form.elements.namedItem("motherName") as HTMLInputElement).value.trim() || undefined,
        guardianPhone: (form.elements.namedItem("guardianPhone") as HTMLInputElement).value.trim() || undefined,
        currentAddress: (form.elements.namedItem("currentAddress") as HTMLTextAreaElement).value.trim() || undefined,
        permanentAddress: (form.elements.namedItem("permanentAddress") as HTMLTextAreaElement).value.trim() || undefined,
        bloodGroup: (form.elements.namedItem("bloodGroup") as HTMLSelectElement).value as StudentPersonalDetails["bloodGroup"] || "",
        healthIssues: (form.elements.namedItem("healthIssues") as HTMLTextAreaElement).value.trim() || undefined,
        aadhaarNumber: aadhaarValue || undefined,
        dateOfBirth: (form.elements.namedItem("dateOfBirth") as HTMLInputElement).value || undefined,
      }
    });
    setEditingPersonal(false);
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "fees", label: "Fee Structure" },
    { id: "feeHistory", label: "Fee History" },
    { id: "personal", label: "Personal Info" },
    { id: "payments", label: "Payments" },
  ] as const;

  const handleFreezeToggle = async () => {
    if (!onFreezeAccount) return;
    const newFrozenState = !student.isFrozen;
    await onFreezeAccount(newFrozenState);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Student Details – ${student.name}${student.isFrozen ? " (Frozen)" : ""}`}
    >
      <div className="space-y-4">
        {/* Frozen Account Banner */}
        {student.isFrozen && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-3 flex items-center gap-3">
            <Snowflake className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Account Frozen</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Student left mid-session. Fees are excluded from calculations.
                {student.frozenAt && ` Frozen on ${formatDate(student.frozenAt)}`}
              </p>
            </div>
            {onFreezeAccount && (
              <Button size="sm" variant="secondary" onClick={handleFreezeToggle}>
                Unfreeze
              </Button>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-slate-200">
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
                  className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 shrink-0"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center shrink-0">
                  <User className="h-10 w-10 text-slate-400" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                <div>
                  <span className="text-slate-500">Admission No:</span>
                  <p className="font-medium text-indigo-600">{student.admissionNumber || "—"}</p>
                </div>
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

            {/* Freeze Account Action */}
            {onFreezeAccount && !student.isFrozen && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Freeze Account
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      If student leaves mid-session, freeze to exclude from fee calculations
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleFreezeToggle}>
                    <Snowflake className="h-4 w-4 mr-1" />
                    Freeze
                  </Button>
                </div>
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
                    <td className="py-2">Registration/Admission fees (one-time)</td>
                    <td className="py-2 text-right">{formatCurrency(registrationFees)}</td>
                    <td className="py-2 text-right text-green-600">{formatCurrency(paidByCategory.registration + (paidByCategory.admission ?? 0))}</td>
                    <td className="py-2 text-right">
                      {student.registrationPaid || (paidByCategory.registration + (paidByCategory.admission ?? 0)) >= registrationFees ? "✓" : "—"}
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
                          20% sibling discount
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Aadhaar Number" helperText="12-digit Aadhaar (optional)">
                    <Input 
                      name="aadhaarNumber" 
                      type="text" 
                      maxLength={12}
                      pattern="[0-9]{12}"
                      defaultValue={student.personalDetails?.aadhaarNumber}
                      placeholder="123456789012"
                    />
                  </FormField>
                  <FormField label="Date of Birth" helperText="Optional">
                    <Input 
                      name="dateOfBirth" 
                      type="date" 
                      defaultValue={student.personalDetails?.dateOfBirth}
                    />
                  </FormField>
                </div>
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
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500">Aadhaar Number:</span>
                      <p className="font-medium font-mono">{student.personalDetails?.aadhaarNumber || "—"}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Date of Birth:</span>
                      <p className="font-medium">
                        {student.personalDetails?.dateOfBirth 
                          ? formatDate(student.personalDetails.dateOfBirth) 
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fee History Tab */}
        {activeTab === "feeHistory" && (() => {
          const monthsToShow = session
            ? getFeeHistoryMonths(session.startDate, session.endDate)
            : [];
          
          const oneTimeFees = getOneTimeFeePayments(student);
          const otherPayments = getOtherPayments(student);
          
          const registrationPaid = oneTimeFees.registration.reduce((sum, p) => sum + p.amount, 0);
          const annualFundPaid = oneTimeFees.annualFund.reduce((sum, p) => sum + p.amount, 0);
          const isRegistrationFullyPaid = registrationPaid >= registrationFees && registrationFees > 0;
          const isAnnualFundFullyPaid = annualFundPaid >= annualFund && annualFund > 0;
          
          return (
            <div className="space-y-4">
              {/* Header: Fee Structure Summary */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      <strong>{student.name}</strong> ({student.studentId})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Class: {studentClass?.name ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Monthly: <strong>{formatCurrency(monthlyFees)}</strong>
                      {student.hasSiblingDiscount && <span className="text-xs text-green-600 ml-1">(20% off)</span>}
                    </p>
                    {transportFees > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Transport: {formatCurrency(transportFees)}/month
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Fees Table */}
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900">
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-600 dark:text-slate-400">
                      <th className="pb-2 pr-4 font-medium">Month</th>
                      <th className="pb-2 pr-4 font-medium">Monthly</th>
                      {transportFees > 0 && <th className="pb-2 pr-4 font-medium">Transport</th>}
                      <th className="pb-2 pr-4 font-medium">Amount</th>
                      <th className="pb-2 pr-4 font-medium">Paid On</th>
                      <th className="pb-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthsToShow.map((month) => {
                      const monthlyStatus = getMonthlyPaymentStatus(student, month, "monthly", monthlyFees);
                      const transportStatus = transportFees > 0 
                        ? getMonthlyPaymentStatus(student, month, "transport", transportFees)
                        : null;
                      
                      const totalForMonth = monthlyStatus.paidAmount + (transportStatus?.paidAmount ?? 0);
                      const latestPayment = [...monthlyStatus.payments, ...(transportStatus?.payments ?? [])]
                        .sort((a, b) => b.date.localeCompare(a.date))[0];
                      
                      const isMonthFullyPaid = monthlyStatus.status === "Paid" && 
                        (transportFees === 0 || transportStatus?.status === "Paid");
                      
                      return (
                        <tr key={month} className="border-b border-slate-100 dark:border-slate-700 group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100">
                            {formatMonthYear(month)}
                          </td>
                          <td className="py-2 pr-4">
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium w-fit",
                              monthlyStatus.status === "Paid" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : monthlyStatus.status === "Partially Paid"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            )}>
                              {monthlyStatus.status === "Paid" && <CheckCircle className="h-3 w-3" />}
                              {monthlyStatus.status === "Partially Paid" && <AlertCircle className="h-3 w-3" />}
                              {monthlyStatus.status === "Not Paid" && <XCircle className="h-3 w-3" />}
                              {monthlyStatus.status}
                            </span>
                          </td>
                          {transportFees > 0 && (
                            <td className="py-2 pr-4">
                              {transportStatus && (
                                <span className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium w-fit",
                                  transportStatus.status === "Paid" 
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : transportStatus.status === "Partially Paid"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                )}>
                                  {transportStatus.status === "Paid" && <CheckCircle className="h-3 w-3" />}
                                  {transportStatus.status === "Partially Paid" && <AlertCircle className="h-3 w-3" />}
                                  {transportStatus.status === "Not Paid" && <XCircle className="h-3 w-3" />}
                                  {transportStatus.status}
                                </span>
                              )}
                            </td>
                          )}
                          <td className="py-2 pr-4 text-slate-900 dark:text-slate-100">
                            {totalForMonth > 0 ? formatCurrency(totalForMonth) : "—"}
                          </td>
                          <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                            {latestPayment ? formatDate(latestPayment.date) : "—"}
                          </td>
                          <td className="py-2">
                            {monthlyStatus.status !== "Paid" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => goToPaymentWithPrefill("monthly", month)}
                                title="Pay monthly fee"
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Pay
                              </Button>
                            )}
                            {transportFees > 0 && transportStatus?.status !== "Paid" && monthlyStatus.status === "Paid" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => goToPaymentWithPrefill("transport", month)}
                                title="Pay transport fee"
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Transport
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* One-time & Other Fees Section */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">One-time & Other Fees</h4>
                
                <div className="space-y-2 text-sm">
                  {/* Registration/Admission */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Registration/Admission</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        isRegistrationFullyPaid
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : registrationPaid > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      )}>
                        {isRegistrationFullyPaid ? (
                          <><CheckCircle className="h-3 w-3" /> Paid</>
                        ) : registrationPaid > 0 ? (
                          <>{formatCurrency(registrationPaid)} / {formatCurrency(registrationFees)}</>
                        ) : registrationFees > 0 ? (
                          <><XCircle className="h-3 w-3" /> {formatCurrency(registrationFees)}</>
                        ) : (
                          "N/A"
                        )}
                      </span>
                      {registrationFees > 0 && !isRegistrationFullyPaid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => goToPaymentWithPrefill("registration")}
                          title="Pay registration fees"
                        >
                          <DollarSign className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Annual Fund */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Annual Fund</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        isAnnualFundFullyPaid
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : annualFundPaid > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      )}>
                        {isAnnualFundFullyPaid ? (
                          <><CheckCircle className="h-3 w-3" /> Paid</>
                        ) : annualFundPaid > 0 ? (
                          <>{formatCurrency(annualFundPaid)} / {formatCurrency(annualFund)}</>
                        ) : annualFund > 0 ? (
                          <><XCircle className="h-3 w-3" /> {formatCurrency(annualFund)}</>
                        ) : (
                          "N/A"
                        )}
                      </span>
                      {annualFund > 0 && !isAnnualFundFullyPaid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => goToPaymentWithPrefill("annualFund")}
                          title="Pay annual fund"
                        >
                          <DollarSign className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Other Payments */}
                {otherPayments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Other Payments</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {otherPayments.map((p) => (
                        <div key={p.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>{formatDate(p.date)}</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer: Totals */}
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Total Paid: <strong className="text-green-600">{formatCurrency(paid)}</strong>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Remaining: <strong className={remaining > 0 ? "text-red-600" : "text-green-600"}>
                      {formatCurrency(remaining)}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-slate-900">Record Payment</h4>
            </div>
            
            {onAddPayment && (() => {
                const isRegistrationPaid = paidByCategory.registration >= registrationFees && registrationFees > 0;
                const isAnnualFundPaid = paidByCategory.annualFund >= annualFund && annualFund > 0;
                
                // Get the amount for current category
                const getCurrentAmount = () => {
                  switch (selectedCategory) {
                    case "registration": return registrationFees;
                    case "annualFund": return annualFund;
                    case "monthly": return monthlyFees;
                    case "transport": return transportFees;
                    default: return "";
                  }
                };
                
                return (
              <form
                key={`payment-form-${paymentMonth}-${selectedCategory}`}
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
                      {availableMonthOptions.length > 0 && (
                        <option value="monthly">Monthly Tuition ({formatCurrency(monthlyFees)}{siblingDiscount > 0 ? " - 20% off" : ""})</option>
                      )}
                      {!isRegistrationPaid && registrationFees > 0 && (
                        <option value="registration">Registration/Admission fees ({formatCurrency(registrationFees)})</option>
                      )}
                      {!isAnnualFundPaid && annualFund > 0 && (
                        <option value="annualFund">Annual Fund ({formatCurrency(annualFund)})</option>
                      )}
                      {transportFees > 0 && availableMonthOptions.length > 0 && (
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
                      defaultValue={getCurrentAmount()}
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
                  {(selectedCategory === "monthly" || selectedCategory === "transport") && (
                  <FormField
                    label="For Month"
                    helperText="Only unpaid months shown"
                  >
                    <Select
                      name="month"
                      value={paymentMonth}
                      onChange={(e) => setPaymentMonth(e.target.value)}
                      className="rounded px-2 py-1.5 text-sm"
                    >
                      {availableMonthOptions.map((m) => (
                        <option key={m} value={m}>
                          {formatMonthYear(m)}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  )}
                </div>
                
                {/* Split Payment Toggle */}
                <div className="flex items-center gap-2 py-2 border-t border-slate-100">
                  <input
                    type="checkbox"
                    id="splitPayment"
                    checked={isSplitPayment}
                    onChange={(e) => {
                      setIsSplitPayment(e.target.checked);
                      if (e.target.checked) {
                        const currentAmount = Number(amountInputRef.current?.value) || 0;
                        setSplitPayments([
                          { id: "1", amount: Math.floor(currentAmount / 2), method: "Cash" },
                          { id: "2", amount: currentAmount - Math.floor(currentAmount / 2), method: "Online" },
                        ]);
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="splitPayment" className="text-sm text-slate-700 dark:text-slate-300">
                    Split payment (pay via multiple methods)
                  </label>
                </div>
                
                {isSplitPayment ? (
                  <div className="space-y-3 rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment Methods</span>
                      <span className="text-xs text-slate-500">
                        Total: {formatCurrency(splitPayments.reduce((sum, sp) => sum + sp.amount, 0))}
                      </span>
                    </div>
                    {splitPayments.map((sp, idx) => (
                      <div key={sp.id} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            type="number"
                            min={0}
                            value={sp.amount}
                            onChange={(e) => {
                              const newPayments = [...splitPayments];
                              newPayments[idx] = { ...sp, amount: Number(e.target.value) || 0 };
                              setSplitPayments(newPayments);
                            }}
                            placeholder="Amount"
                            className="rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <Select
                            value={sp.method}
                            onChange={(e) => {
                              const newPayments = [...splitPayments];
                              newPayments[idx] = { ...sp, method: e.target.value as PaymentMethod };
                              setSplitPayments(newPayments);
                            }}
                            className="rounded px-2 py-1.5 text-sm"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Online">Online</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                          </Select>
                        </div>
                        {splitPayments.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSplitPayments(splitPayments.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSplitPayments([...splitPayments, { id: String(Date.now()), amount: 0, method: "Cash" }])}
                      className="text-indigo-600"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Payment Method
                    </Button>
                  </div>
                ) : (
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
                )}
                
                {isSplitPayment && (
                  <FormField label="Receipt #">
                    <Input name="receiptNumber" type="text" className="rounded px-2 py-1.5 text-sm" />
                  </FormField>
                )}
                
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
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="secondary" 
                    disabled={isSubmitting}
                    onClick={() => {
                      setShowPaymentForm(false);
                      setReceiptPhotoPreview(null);
                      setIsSplitPayment(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      "Record Payment"
                    )}
                  </Button>
                </div>
              </form>
                );
            })()}

            {student.payments.length === 0 ? (
              <p className="text-sm text-slate-500">No payments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-600">
                      <th className="pb-2 pr-2 font-medium">Date</th>
                      <th className="pb-2 pr-2 font-medium">Category</th>
                      <th className="pb-2 pr-2 font-medium">For Month</th>
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
                        <td className="py-1.5 pr-2">{payment.month ? formatMonthYear(payment.month) : "—"}</td>
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
