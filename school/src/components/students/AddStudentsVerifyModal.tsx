import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type {
  Student,
  StudentClass,
  FeeType,
  StudentPersonalDetails,
} from "../../types";
import { ChevronDown, ChevronUp, User } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

export type PendingStudent = Omit<Student, "id" | "payments">;

const FEE_TYPES: FeeType[] = [
  "Regular",
  "Boarding",
  "Day Scholar + Meals",
  "Boarding + Meals",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

interface AddStudentsVerifyModalProps {
  open: boolean;
  onClose: () => void;
  pending: PendingStudent[];
  sessionClasses: StudentClass[];
  onConfirm: (students: PendingStudent[]) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function AddStudentsVerifyModal({
  open,
  onClose,
  pending,
  sessionClasses,
  onConfirm,
  isSubmitting = false,
}: AddStudentsVerifyModalProps) {
  const [students, setStudents] = useState<PendingStudent[]>(pending);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    if (open && pending.length > 0) {
      setStudents(pending);
      setExpandedIndex(0);
    }
  }, [open, pending]);

  const updateStudent = (index: number, updates: Partial<PendingStudent>) => {
    setStudents((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  const updatePersonal = (
    index: number,
    updates: Partial<StudentPersonalDetails>
  ) => {
    setStudents((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              personalDetails: { ...s.personalDetails, ...updates },
            }
          : s
      )
    );
  };

  const handleConfirm = () => {
    const valid = students.filter((s) => s.name.trim());
    if (valid.length === 0) return;
    onConfirm(valid);
  };

  const removeStudent = (index: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index)
      setExpandedIndex(expandedIndex - 1);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Verify & add students">
      <p className="text-sm text-slate-600 mb-4">
        Review the details below. Edit any field if needed, then confirm to add
        {students.length === 1 ? " this student" : ` ${students.length} students`}.
      </p>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {students.map((s, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden"
          >
            <button
              type="button"
              onClick={() =>
                setExpandedIndex((prev) => (prev === index ? null : index))
              }
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100/80"
            >
              <span className="font-medium text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                {s.name || "(No name)"}
                {s.classId && (
                  <span className="text-slate-500 font-normal text-sm">
                    – {sessionClasses.find((c) => c.id === s.classId)?.name}
                  </span>
                )}
              </span>
              {expandedIndex === index ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>
            {expandedIndex === index && (
              <div className="px-4 pb-4 pt-0 space-y-4 border-t border-slate-100 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) =>
                        updateStudent(index, { name: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={s.studentId || ""}
                      onChange={(e) =>
                        updateStudent(index, {
                          studentId: e.target.value || undefined,
                        })
                      }
                      placeholder="Auto-generated if empty"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Class
                    </label>
                    <select
                      value={s.classId ?? ""}
                      onChange={(e) =>
                        updateStudent(index, {
                          classId: e.target.value || undefined,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    >
                      <option value="">— No class —</option>
                      {sessionClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (₹{c.monthlyFees.toLocaleString()}/month)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Fee type
                    </label>
                    <select
                      value={s.feeType}
                      onChange={(e) =>
                        updateStudent(index, {
                          feeType: e.target.value as FeeType,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    >
                      {FEE_TYPES.map((ft) => (
                        <option key={ft} value={ft}>
                          {ft}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="font-medium">Reg:</span>{" "}
                    {formatCurrency(s.registrationFees ?? 0)}
                  </div>
                  <div>
                    <span className="font-medium">Adm:</span>{" "}
                    {formatCurrency(s.admissionFees ?? 0)}
                  </div>
                  <div>
                    <span className="font-medium">Monthly:</span>{" "}
                    {formatCurrency(s.monthlyFees ?? 0)}
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-slate-700 border-b pb-1">
                    Personal details (optional)
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Father name"
                      value={s.personalDetails?.fatherName ?? ""}
                      onChange={(e) =>
                        updatePersonal(index, { fatherName: e.target.value || undefined })
                      }
                      className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      placeholder="Mother name"
                      value={s.personalDetails?.motherName ?? ""}
                      onChange={(e) =>
                        updatePersonal(index, { motherName: e.target.value || undefined })
                      }
                      className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      placeholder="Guardian phone"
                      value={s.personalDetails?.guardianPhone ?? ""}
                      onChange={(e) =>
                        updatePersonal(index, {
                          guardianPhone: e.target.value || undefined,
                        })
                      }
                      className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                    />
                    <select
                      value={s.personalDetails?.bloodGroup ?? ""}
                      onChange={(e) =>
                        updatePersonal(index, {
                          bloodGroup: (e.target.value || undefined) as
                            | StudentPersonalDetails["bloodGroup"]
                            | undefined,
                        })
                      }
                      className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Blood group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Current address"
                    value={s.personalDetails?.currentAddress ?? ""}
                    onChange={(e) =>
                      updatePersonal(index, {
                        currentAddress: e.target.value || undefined,
                      })
                    }
                    className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Health issues / allergies"
                    value={s.personalDetails?.healthIssues ?? ""}
                    onChange={(e) =>
                      updatePersonal(index, {
                        healthIssues: e.target.value || undefined,
                      })
                    }
                    className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
                {students.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => removeStudent(index)}
                  >
                    Remove this student
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={
            isSubmitting ||
            students.length === 0 ||
            students.every((s) => !s.name.trim())
          }
        >
          {isSubmitting
            ? "Adding…"
            : `Add ${students.filter((s) => s.name.trim()).length} student(s)`}
        </Button>
      </div>
    </Modal>
  );
}
