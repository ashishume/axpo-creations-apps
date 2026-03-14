import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { Check, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { StudentClass, Staff, PaymentMethod, ExpenseCategory, FeeType } from "../../types";
import { STAFF_ROLES } from "../../constants/staffRoles";
import type { IntentType } from "../../lib/axpoAssistantParser";
import { cn } from "../../lib/utils";
import { SkeletonForm } from "../ui/Skeleton";

// ============================================================================
// Types
// ============================================================================

interface InlineFormCardProps {
  type: "student" | "staff" | "expense" | "stock" | "fixedCost" | "salaryPayment" | "class";
  operation: "add" | "update" | "delete" | "query";
  intent: IntentType;
  data: Record<string, unknown> | Record<string, unknown>[];
  sessionClasses?: StudentClass[];
  sessionStaff?: Staff[];
  onConfirm: (finalData: Record<string, unknown> | Record<string, unknown>[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

const FEE_TYPES: FeeType[] = ["Regular", "Boarding", "Day Scholar + Meals", "Boarding + Meals"];
const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Cheque", "Online", "Bank Transfer"];
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Transportation",
  "Events",
  "Utilities",
  "Supplies",
  "Infrastructure",
  "Miscellaneous",
];
const SALARY_STATUSES = ["Paid", "Pending", "Partially Paid"] as const;

// ============================================================================
// Component
// ============================================================================

export function InlineFormCard({
  type,
  operation,
  intent,
  data,
  sessionClasses = [],
  sessionStaff = [],
  onConfirm,
  onCancel,
  isLoading = false,
  isSubmitting = false,
}: InlineFormCardProps) {
  const initialItems = Array.isArray(data) ? [...data] : [data];
  const [formDataList, setFormDataList] = useState<Record<string, unknown>[]>(initialItems);
  const [showDetails, setShowDetails] = useState(true);
  const isBatch = initialItems.length > 1;

  useEffect(() => {
    const next = Array.isArray(data) ? [...data] : [data];
    setFormDataList(next);
  }, [data]);

  const updateField = (itemIndex: number, field: string, value: unknown) => {
    setFormDataList((prev) => {
      const next = [...prev];
      next[itemIndex] = { ...next[itemIndex], [field]: value };
      return next;
    });
  };

  const handleConfirm = () => {
    if (isBatch) {
      onConfirm(formDataList);
    } else {
      onConfirm(formDataList[0] ?? {});
    }
  };

  const getTitle = () => {
    const opLabel = operation === "add" ? "Add" : operation === "update" ? "Update" : "Delete";
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1");
    if (isBatch && formDataList.length > 1) return `${opLabel} ${typeLabel} (${formDataList.length} items)`;
    return `${opLabel} ${typeLabel}`;
  };

  const isDelete = operation === "delete";

  // ============================================================================
  // Form Fields by Type
  // ============================================================================

  const renderStudentFields = (itemIndex: number = 0) => {
    const row = formDataList[itemIndex] ?? {};
    const upd = (field: string, value: unknown) => updateField(itemIndex, field, value);
    return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Name</label>
          <Input
            type="text"
            value={(row.name as string) || ""}
            onChange={(e) => upd("name", e.target.value)}
            disabled={isDelete}
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Student ID</label>
          <Input
            type="text"
            value={(row.studentId as string) || ""}
            onChange={(e) => upd("studentId", e.target.value)}
            disabled={isDelete}
            className="text-sm"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Class</label>
          <Select
            value={(row.classId as string) || ""}
            onChange={(e) => {
              const classId = e.target.value;
              upd("classId", classId);
              const selectedClass = sessionClasses.find((c) => c.id === classId);
              if (selectedClass) {
                // Only apply class values when non-zero; otherwise keep existing row values
                if (selectedClass.registrationFees != null && Number(selectedClass.registrationFees) !== 0) upd("registrationFees", selectedClass.registrationFees);
                if (selectedClass.annualFund != null && Number(selectedClass.annualFund) !== 0) upd("annualFund", selectedClass.annualFund);
                if (selectedClass.monthlyFees != null && Number(selectedClass.monthlyFees) !== 0) upd("monthlyFees", selectedClass.monthlyFees);
                if (selectedClass.dueDayOfMonth != null && Number(selectedClass.dueDayOfMonth) !== 0) upd("dueDayOfMonth", selectedClass.dueDayOfMonth);
                if (selectedClass.lateFeeAmount != null && Number(selectedClass.lateFeeAmount) !== 0) upd("lateFeeAmount", selectedClass.lateFeeAmount);
                if (selectedClass.lateFeeFrequency) upd("lateFeeFrequency", selectedClass.lateFeeFrequency);
              }
            }}
            disabled={isDelete}
            className="text-sm"
          >
            <option value="">Select class...</option>
            {sessionClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Fee Type</label>
          <Select
            value={(row.feeType as string) || "Regular"}
            onChange={(e) => upd("feeType", e.target.value)}
            disabled={isDelete}
            className="text-sm"
          >
            {FEE_TYPES.map((ft) => (
              <option key={ft} value={ft}>
                {ft}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Personal Details Collapsible */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="flex w-full items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <span>Personal Details</span>
        {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {showDetails && (
        <div className="space-y-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Father's Name</label>
              <Input
                type="text"
                value={(row.personalDetails as Record<string, string>)?.fatherName || ""}
                onChange={(e) =>
                  upd("personalDetails", {
                    ...(row.personalDetails as Record<string, string>),
                    fatherName: e.target.value,
                  })
                }
                disabled={isDelete}
                className="text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Mother's Name</label>
              <Input
                type="text"
                value={(row.personalDetails as Record<string, string>)?.motherName || ""}
                onChange={(e) =>
                  upd("personalDetails", {
                    ...(row.personalDetails as Record<string, string>),
                    motherName: e.target.value,
                  })
                }
                disabled={isDelete}
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Guardian Phone</label>
            <Input
              type="text"
              value={(row.personalDetails as Record<string, string>)?.guardianPhone || ""}
              onChange={(e) =>
                upd("personalDetails", {
                  ...(row.personalDetails as Record<string, string>),
                  guardianPhone: e.target.value,
                })
              }
              disabled={isDelete}
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
  };

  const renderClassFields = (itemIndex: number = 0) => {
    const row = formDataList[itemIndex] ?? {};
    const upd = (field: string, value: unknown) => updateField(itemIndex, field, value);
    return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Class name *</label>
          <Input
            type="text"
            value={(row.name as string) || ""}
            onChange={(e) => upd("name", e.target.value)}
            disabled={isDelete}
            placeholder="e.g. Class 1, Nursery"
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Due day (1–28)</label>
          <Input
            type="number"
            min={1}
            max={28}
            value={Number(row.dueDayOfMonth) || 10}
            onChange={(e) => upd("dueDayOfMonth", e.target.value === "" ? 10 : Number(e.target.value))}
            disabled={isDelete}
            className="text-sm"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Registration/Admission (₹)</label>
          <Input
            type="number"
            min={0}
            value={Number(row.registrationFees) || ""}
            onChange={(e) => upd("registrationFees", e.target.value ? Number(e.target.value) : 0)}
            disabled={isDelete}
            placeholder="₹"
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Annual Fund (₹)</label>
          <Input
            type="number"
            min={0}
            value={Number(row.annualFund) || ""}
            onChange={(e) => upd("annualFund", e.target.value ? Number(e.target.value) : 0)}
            disabled={isDelete}
            placeholder="₹"
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Monthly Fee (₹)</label>
          <Input
            type="number"
            min={0}
            value={Number(row.monthlyFees) || ""}
            onChange={(e) => upd("monthlyFees", e.target.value ? Number(e.target.value) : 0)}
            disabled={isDelete}
            placeholder="₹"
            className="text-sm"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Late fee amount (₹)</label>
          <Input
            type="number"
            min={0}
            value={Number(row.lateFeeAmount) || ""}
            onChange={(e) => upd("lateFeeAmount", e.target.value ? Number(e.target.value) : 0)}
            disabled={isDelete}
            placeholder="₹"
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Late fee frequency</label>
          <Select
            value={(row.lateFeeFrequency as string) || "weekly"}
            onChange={(e) => upd("lateFeeFrequency", e.target.value as "daily" | "weekly")}
            disabled={isDelete}
            className="text-sm"
          >
            <option value="weekly">Per week</option>
            <option value="daily">Per day</option>
          </Select>
        </div>
      </div>
    </div>
  );
  };

  const renderStaffFields = (itemIndex: number = 0) => {
    const row = formDataList[itemIndex] ?? {};
    const upd = (field: string, value: unknown) => updateField(itemIndex, field, value);
    return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Name</label>
          <Input
            type="text"
            value={(row.name as string) || ""}
            onChange={(e) => upd("name", e.target.value)}
            disabled={isDelete}
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Employee ID</label>
          <Input
            type="text"
            value={(row.employeeId as string) || ""}
            onChange={(e) => upd("employeeId", e.target.value)}
            disabled={isDelete}
            className="text-sm"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Role</label>
          <Select
            value={(row.role as string) || "Teacher"}
            onChange={(e) => upd("role", e.target.value)}
            disabled={isDelete}
            className="text-sm"
          >
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Monthly Salary</label>
          <Input
            type="number"
            value={(row.monthlySalary as number) || ""}
            onChange={(e) => upd("monthlySalary", Number(e.target.value))}
            disabled={isDelete}
            className="text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Subject/Grade (for teachers)</label>
        <Input
          type="text"
          value={(row.subjectOrGrade as string) || ""}
          onChange={(e) => upd("subjectOrGrade", e.target.value)}
          disabled={isDelete}
          className="text-sm"
        />
      </div>
    </div>
  );
  };

  const renderSalaryPaymentFields = (itemIndex: number = 0) => {
    const row = formDataList[itemIndex] ?? {};
    const upd = (field: string, value: unknown) => updateField(itemIndex, field, value);
    return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Staff Member</label>
          <Select
            value={(row.staffId as string) || ""}
            onChange={(e) => {
              const staffId = e.target.value;
              upd("staffId", staffId);
              const selectedStaff = sessionStaff.find((s) => s.id === staffId);
              if (selectedStaff) {
                upd("staffName", selectedStaff.name);
                upd("amount", selectedStaff.monthlySalary);
              }
            }}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="">Select staff...</option>
            {sessionStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - ₹{s.monthlySalary.toLocaleString()}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Month</label>
          <Input
            type="month"
            value={(row.month as string) || ""}
            onChange={(e) => upd("month", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Amount</label>
          <Input
            type="number"
            value={(row.amount as number) || ""}
            onChange={(e) => upd("amount", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
          <Select
            value={(row.status as string) || "Paid"}
            onChange={(e) => upd("status", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            {SALARY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Payment Method</label>
          <Select
            value={(row.method as string) || "Cash"}
            onChange={(e) => upd("method", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Payment Date</label>
        <Input
          type="date"
          value={(row.paymentDate as string) || ""}
          onChange={(e) => upd("paymentDate", e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>
    </div>
  );
  };

  const renderExpenseFields = (itemIndex: number = 0) => {
    const row = formDataList[itemIndex] ?? {};
    const upd = (field: string, value: unknown) => updateField(itemIndex, field, value);
    return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Amount</label>
          <Input
            type="number"
            value={(row.amount as number) || ""}
            onChange={(e) => upd("amount", Number(e.target.value))}
            disabled={isDelete}
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Date</label>
          <Input
            type="date"
            value={(row.date as string) || ""}
            onChange={(e) => upd("date", e.target.value)}
            disabled={isDelete}
            className="text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
        <Input
          type="text"
          value={(row.description as string) || ""}
          onChange={(e) => upd("description", e.target.value)}
          disabled={isDelete}
          className="text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Category</label>
          <Select
            value={(row.category as string) || "Miscellaneous"}
            onChange={(e) => upd("category", e.target.value)}
            disabled={isDelete}
            className="text-sm"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Payment Method</label>
          <Select
            value={(row.paymentMethod as string) || "Cash"}
            onChange={(e) => upd("paymentMethod", e.target.value)}
            disabled={isDelete}
            className="text-sm"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Vendor/Payee</label>
        <Input
          type="text"
          value={(row.vendorPayee as string) || ""}
          onChange={(e) => upd("vendorPayee", e.target.value)}
          disabled={isDelete}
          className="text-sm"
        />
      </div>
    </div>
  );
  };

  const renderStockFields = (itemIndex: number = 0) => {
    const row = formDataList[itemIndex] ?? {};
    const upd = (field: string, value: unknown) => updateField(itemIndex, field, value);
    return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Publisher Name</label>
          <Input
            type="text"
            value={(row.publisherName as string) || ""}
            onChange={(e) => upd("publisherName", e.target.value)}
            disabled={isDelete}
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Credit Amount</label>
          <Input
            type="number"
            value={(row.totalCreditAmount as number) || ""}
            onChange={(e) => upd("totalCreditAmount", Number(e.target.value))}
            disabled={isDelete}
            className="text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
        <Input
          type="text"
          value={(row.description as string) || ""}
          onChange={(e) => upd("description", e.target.value)}
          disabled={isDelete}
          className="text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Purchase Date</label>
        <Input
          type="date"
          value={(row.purchaseDate as string) || ""}
          onChange={(e) => upd("purchaseDate", e.target.value)}
          disabled={isDelete}
          className="text-sm"
        />
      </div>
    </div>
  );
  };

  const renderFixedCostFields = (itemIndex: number = 0) => {
    const row = formDataList[itemIndex] ?? {};
    const upd = (field: string, value: unknown) => updateField(itemIndex, field, value);
    return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Name</label>
          <Input
            type="text"
            value={(row.name as string) || ""}
            onChange={(e) => upd("name", e.target.value)}
            disabled={isDelete}
            placeholder="e.g., Rent, Internet"
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Monthly Amount</label>
          <Input
            type="number"
            value={(row.amount as number) || ""}
            onChange={(e) => upd("amount", Number(e.target.value))}
            disabled={isDelete}
            className="text-sm"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Category</label>
          <Select
            value={(row.category as string) || "Miscellaneous"}
            onChange={(e) => upd("category", e.target.value)}
            disabled={isDelete}
            className="text-sm"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Input
            type="checkbox"
            id={`isActive-${itemIndex}`}
            checked={(row.isActive as boolean) !== false}
            onChange={(e) => upd("isActive", e.target.checked)}
            disabled={isDelete}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor={`isActive-${itemIndex}`} className="text-sm text-slate-600 dark:text-slate-300">
            Active
          </label>
        </div>
      </div>
    </div>
  );
  };

  const renderFormFields = (itemIndex: number = 0) => {
    if (intent === "pay_salary") return renderSalaryPaymentFields(itemIndex);
    if (intent === "add_class" || type === "class") return renderClassFields(itemIndex);
    switch (type) {
      case "student":
        return renderStudentFields(itemIndex);
      case "staff":
        return renderStaffFields(itemIndex);
      case "salaryPayment":
        return renderSalaryPaymentFields(itemIndex);
      case "expense":
        return renderExpenseFields(itemIndex);
      case "stock":
        return renderStockFields(itemIndex);
      case "fixedCost":
        return renderFixedCostFields(itemIndex);
      default:
        return null;
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="ml-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between rounded-t-xl border-b border-slate-100 dark:border-slate-700 px-4 py-3",
          isDelete ? "bg-red-50 dark:bg-red-950/30" : "bg-slate-50 dark:bg-slate-800"
        )}
      >
        <h3 className={cn("text-sm font-semibold", isDelete ? "text-red-800 dark:text-red-200" : "text-slate-800 dark:text-slate-100")}>
          {getTitle()}
        </h3>
        {isDelete && (
          <span className="rounded bg-red-100 dark:bg-red-900/50 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-200">
            This action cannot be undone
          </span>
        )}
      </div>

      {/* Form */}
      <div className="p-4">
        {isLoading ? (
          <SkeletonForm fields={type === "student" ? 6 : type === "staff" ? 5 : 4} />
        ) : isBatch && formDataList.length > 1 ? (
          <div className="space-y-6">
            {formDataList.map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4">
                <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">Item {i + 1} of {formDataList.length}</p>
                {renderFormFields(i)}
              </div>
            ))}
          </div>
        ) : (
          renderFormFields(0)
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
          <X className="mr-1 h-4 w-4" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={isLoading || isSubmitting}
          className={cn(isDelete && "bg-red-600 hover:bg-red-700")}
        >
          {isSubmitting ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-1 h-4 w-4" />
          )}
          {isSubmitting ? "Processing..." : isDelete ? "Delete" : "Confirm"}
        </Button>
      </div>
    </div>
  );
}
