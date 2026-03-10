import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Check, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { StudentClass, Staff, StaffRole, PaymentMethod, ExpenseCategory, FeeType } from "../../types";
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
const STAFF_ROLES: StaffRole[] = ["Teacher", "Administrative", "Bus Driver", "Support Staff"];
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
          <input
            type="text"
            value={(row.name as string) || ""}
            onChange={(e) => upd("name", e.target.value)}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Student ID</label>
          <input
            type="text"
            value={(row.studentId as string) || ""}
            onChange={(e) => upd("studentId", e.target.value)}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Class</label>
          <select
            value={(row.classId as string) || ""}
            onChange={(e) => {
              const classId = e.target.value;
              upd("classId", classId);
              const selectedClass = sessionClasses.find((c) => c.id === classId);
              if (selectedClass) {
                upd("registrationFees", selectedClass.registrationFees);
                upd("admissionFees", selectedClass.admissionFees);
                upd("annualFund", selectedClass.annualFund);
                upd("monthlyFees", selectedClass.monthlyFees);
                upd("dueDayOfMonth", selectedClass.dueDayOfMonth);
                upd("lateFeeAmount", selectedClass.lateFeeAmount);
                upd("lateFeeFrequency", selectedClass.lateFeeFrequency);
              }
            }}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          >
            <option value="">Select class...</option>
            {sessionClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Fee Type</label>
          <select
            value={(row.feeType as string) || "Regular"}
            onChange={(e) => upd("feeType", e.target.value)}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          >
            {FEE_TYPES.map((ft) => (
              <option key={ft} value={ft}>
                {ft}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Personal Details Collapsible */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
      >
        <span>Personal Details</span>
        {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {showDetails && (
        <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Father's Name</label>
              <input
                type="text"
                value={(row.personalDetails as Record<string, string>)?.fatherName || ""}
                onChange={(e) =>
                  upd("personalDetails", {
                    ...(row.personalDetails as Record<string, string>),
                    fatherName: e.target.value,
                  })
                }
                disabled={isDelete}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Mother's Name</label>
              <input
                type="text"
                value={(row.personalDetails as Record<string, string>)?.motherName || ""}
                onChange={(e) =>
                  upd("personalDetails", {
                    ...(row.personalDetails as Record<string, string>),
                    motherName: e.target.value,
                  })
                }
                disabled={isDelete}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Guardian Phone</label>
            <input
              type="text"
              value={(row.personalDetails as Record<string, string>)?.guardianPhone || ""}
              onChange={(e) =>
                upd("personalDetails", {
                  ...(row.personalDetails as Record<string, string>),
                  guardianPhone: e.target.value,
                })
              }
              disabled={isDelete}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Class name *</label>
          <input
            type="text"
            value={(row.name as string) || ""}
            onChange={(e) => upd("name", e.target.value)}
            disabled={isDelete}
            placeholder="e.g. Class 1, Nursery"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Due day (1–28)</label>
          <input
            type="number"
            min={1}
            max={28}
            value={Number(row.dueDayOfMonth) || 10}
            onChange={(e) => upd("dueDayOfMonth", e.target.value === "" ? 10 : Number(e.target.value))}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Registration (₹)</label>
          <input
            type="number"
            min={0}
            value={Number(row.registrationFees) || ""}
            onChange={(e) => upd("registrationFees", e.target.value ? Number(e.target.value) : 0)}
            disabled={isDelete}
            placeholder="₹"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Admission (₹)</label>
          <input
            type="number"
            min={0}
            value={Number(row.admissionFees) || ""}
            onChange={(e) => upd("admissionFees", e.target.value ? Number(e.target.value) : 0)}
            disabled={isDelete}
            placeholder="₹"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Annual Fund (₹)</label>
          <input
            type="number"
            min={0}
            value={Number(row.annualFund) || ""}
            onChange={(e) => upd("annualFund", e.target.value ? Number(e.target.value) : 0)}
            disabled={isDelete}
            placeholder="₹"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Monthly Fee (₹)</label>
          <input
            type="number"
            min={0}
            value={Number(row.monthlyFees) || ""}
            onChange={(e) => upd("monthlyFees", e.target.value ? Number(e.target.value) : 0)}
            disabled={isDelete}
            placeholder="₹"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Late fee amount (₹)</label>
          <input
            type="number"
            min={0}
            value={Number(row.lateFeeAmount) || ""}
            onChange={(e) => upd("lateFeeAmount", e.target.value ? Number(e.target.value) : 0)}
            disabled={isDelete}
            placeholder="₹"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Late fee frequency</label>
          <select
            value={(row.lateFeeFrequency as string) || "weekly"}
            onChange={(e) => upd("lateFeeFrequency", e.target.value as "daily" | "weekly")}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          >
            <option value="weekly">Per week</option>
            <option value="daily">Per day</option>
          </select>
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
          <input
            type="text"
            value={(row.name as string) || ""}
            onChange={(e) => upd("name", e.target.value)}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Employee ID</label>
          <input
            type="text"
            value={(row.employeeId as string) || ""}
            onChange={(e) => upd("employeeId", e.target.value)}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Role</label>
          <select
            value={(row.role as string) || "Teacher"}
            onChange={(e) => upd("role", e.target.value)}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          >
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Monthly Salary</label>
          <input
            type="number"
            value={(row.monthlySalary as number) || ""}
            onChange={(e) => upd("monthlySalary", Number(e.target.value))}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Subject/Grade (for teachers)</label>
        <input
          type="text"
          value={(row.subjectOrGrade as string) || ""}
          onChange={(e) => upd("subjectOrGrade", e.target.value)}
          disabled={isDelete}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Staff Member</label>
          <select
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
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Month</label>
          <input
            type="month"
            value={(row.month as string) || ""}
            onChange={(e) => upd("month", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Amount</label>
          <input
            type="number"
            value={(row.amount as number) || ""}
            onChange={(e) => upd("amount", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
          <select
            value={(row.status as string) || "Paid"}
            onChange={(e) => upd("status", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            {SALARY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Payment Method</label>
          <select
            value={(row.method as string) || "Cash"}
            onChange={(e) => upd("method", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Payment Date</label>
        <input
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Amount</label>
          <input
            type="number"
            value={(row.amount as number) || ""}
            onChange={(e) => upd("amount", Number(e.target.value))}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
          <input
            type="date"
            value={(row.date as string) || ""}
            onChange={(e) => upd("date", e.target.value)}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
        <input
          type="text"
          value={(row.description as string) || ""}
          onChange={(e) => upd("description", e.target.value)}
          disabled={isDelete}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
          <select
            value={(row.category as string) || "Miscellaneous"}
            onChange={(e) => upd("category", e.target.value)}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Payment Method</label>
          <select
            value={(row.paymentMethod as string) || "Cash"}
            onChange={(e) => upd("paymentMethod", e.target.value)}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Vendor/Payee</label>
        <input
          type="text"
          value={(row.vendorPayee as string) || ""}
          onChange={(e) => upd("vendorPayee", e.target.value)}
          disabled={isDelete}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Publisher Name</label>
          <input
            type="text"
            value={(row.publisherName as string) || ""}
            onChange={(e) => upd("publisherName", e.target.value)}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Credit Amount</label>
          <input
            type="number"
            value={(row.totalCreditAmount as number) || ""}
            onChange={(e) => upd("totalCreditAmount", Number(e.target.value))}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
        <input
          type="text"
          value={(row.description as string) || ""}
          onChange={(e) => upd("description", e.target.value)}
          disabled={isDelete}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Purchase Date</label>
        <input
          type="date"
          value={(row.purchaseDate as string) || ""}
          onChange={(e) => upd("purchaseDate", e.target.value)}
          disabled={isDelete}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
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
          <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
          <input
            type="text"
            value={(row.name as string) || ""}
            onChange={(e) => upd("name", e.target.value)}
            disabled={isDelete}
            placeholder="e.g., Rent, Internet"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Monthly Amount</label>
          <input
            type="number"
            value={(row.amount as number) || ""}
            onChange={(e) => upd("amount", Number(e.target.value))}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
          <select
            value={(row.category as string) || "Miscellaneous"}
            onChange={(e) => upd("category", e.target.value)}
            disabled={isDelete}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id={`isActive-${itemIndex}`}
            checked={(row.isActive as boolean) !== false}
            onChange={(e) => upd("isActive", e.target.checked)}
            disabled={isDelete}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor={`isActive-${itemIndex}`} className="text-sm text-slate-600">
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
    <div className="ml-11 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between rounded-t-xl border-b border-slate-100 px-4 py-3",
          isDelete ? "bg-red-50" : "bg-slate-50"
        )}
      >
        <h3 className={cn("text-sm font-semibold", isDelete ? "text-red-800" : "text-slate-800")}>
          {getTitle()}
        </h3>
        {isDelete && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
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
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <p className="mb-3 text-xs font-medium text-slate-500">Item {i + 1} of {formDataList.length}</p>
                {renderFormFields(i)}
              </div>
            ))}
          </div>
        ) : (
          renderFormFields(0)
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
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
