import { useState, useMemo } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { FormField } from "../ui/FormField";
import { useApplyLeave, useLeaveBalances } from "../../hooks/useLeaves";
import type { LeaveType, LeaveBalance, Staff, Student } from "../../types";
import type { User } from "../../types/auth";

function daysBetween(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  if (b < a) return 0;
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

interface ApplyLeaveModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  sessionYear: string;
  leaveTypes: LeaveType[];
  staff: Staff[];
  students: Student[];
  currentUser: User | null;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function ApplyLeaveModal({
  open,
  onClose,
  sessionId,
  sessionYear,
  leaveTypes,
  staff,
  students,
  currentUser,
  onSuccess,
  onError,
}: ApplyLeaveModalProps) {
  const [applicantType, setApplicantType] = useState<"staff" | "student">("staff");
  const [staffId, setStaffId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [leaveTypeId, setLeaveTypeId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [documentUrl, setDocumentUrl] = useState<string>("");

  const preselectedStaffId = currentUser?.staffId ?? "";
  const preselectedStudentId = currentUser?.studentId ?? "";
  const effectiveStaffId = applicantType === "staff" ? (staffId || preselectedStaffId) : "";
  const { data: staffBalances = [] } = useLeaveBalances(effectiveStaffId, sessionYear, {
    enabled: applicantType === "staff" && !!effectiveStaffId && !!sessionYear,
  });

  const applyLeave = useApplyLeave();

  const selectedLeaveBalance = useMemo((): LeaveBalance | undefined => {
    if (applicantType !== "staff" || !leaveTypeId) return undefined;
    return staffBalances.find((b) => b.leaveTypeId === leaveTypeId);
  }, [applicantType, leaveTypeId, staffBalances]);

  const availableDays = selectedLeaveBalance
    ? selectedLeaveBalance.totalDays - selectedLeaveBalance.usedDays
    : null;

  const applicableTypes = useMemo(() => {
    if (applicantType === "staff")
      return leaveTypes.filter((t) => t.applicableTo === "staff" || t.applicableTo === "both");
    return leaveTypes.filter((t) => t.applicableTo === "student" || t.applicableTo === "both");
  }, [leaveTypes, applicantType]);

  const daysCount = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    return daysBetween(fromDate, toDate);
  }, [fromDate, toDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sid = applicantType === "staff" ? staffId : studentId;
    if (!sid) {
      onError("Please select an applicant.");
      return;
    }
    if (!leaveTypeId) {
      onError("Please select a leave type.");
      return;
    }
    if (applicantType === "staff") {
      if (!selectedLeaveBalance) {
        onError(
          "Leave balance not initialized for this staff. Ask admin to initialize in Leave Management (Balances tab)."
        );
        return;
      }
      const available = selectedLeaveBalance.totalDays - selectedLeaveBalance.usedDays;
      if (daysCount > available) {
        onError(
          `Insufficient leave balance. Available: ${available} days for this leave type.`
        );
        return;
      }
    }
    if (!fromDate || !toDate) {
      onError("Please select from and to dates.");
      return;
    }
    if (daysCount <= 0) {
      onError("To date must be on or after from date.");
      return;
    }
    if (!reason.trim()) {
      onError("Please enter a reason.");
      return;
    }
    try {
      await applyLeave.mutateAsync({
        sessionId,
        leaveTypeId,
        applicantType,
        staffId: applicantType === "staff" ? sid : undefined,
        studentId: applicantType === "student" ? sid : undefined,
        fromDate,
        toDate,
        daysCount,
        reason: reason.trim(),
        documentUrl: documentUrl.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to apply for leave");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Apply for leave">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Applicant type">
          <Select
            value={applicantType}
            onChange={(e) => {
              setApplicantType(e.target.value as "staff" | "student");
              setStaffId("");
              setStudentId("");
              setLeaveTypeId("");
            }}
          >
            <option value="staff">Staff</option>
            <option value="student">Student</option>
          </Select>
        </FormField>

        {applicantType === "staff" && (
          <FormField label="Staff member" required>
            <Select
              value={staffId || preselectedStaffId}
              onChange={(e) => setStaffId(e.target.value)}
              required
            >
              <option value="">Select staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.employeeId})
                </option>
              ))}
            </Select>
          </FormField>
        )}
        {applicantType === "student" && (
          <FormField label="Student" required>
            <Select
              value={studentId || preselectedStudentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentId})
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <FormField label="Leave type" required>
          <Select
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            required
          >
            <option value="">Select leave type</option>
            {applicableTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name} ({lt.code})
                {lt.maxDaysPerYear != null ? ` — max ${lt.maxDaysPerYear} days/year` : ""}
              </option>
            ))}
          </Select>
          {applicantType === "staff" && effectiveStaffId && leaveTypeId && (
            <div className="mt-2 text-sm">
              {selectedLeaveBalance ? (
                <span className="text-slate-600 dark:text-slate-300">
                  Available balance: <strong className="text-slate-900 dark:text-slate-100">{availableDays}</strong> days
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-300">
                  Leave balance not initialized for this staff. Ask admin to initialize in Leave Management → Balances.
                </span>
              )}
            </div>
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="From date" required>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
            />
          </FormField>
          <FormField label="To date" required>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              required
            />
          </FormField>
        </div>
        {fromDate && toDate && daysCount > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Total days: {daysCount}</p>
        )}

        <FormField label="Reason" required>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason for leave"
            required
          />
        </FormField>

        <FormField label="Document URL (optional)">
          <Input
            type="url"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            placeholder="https://..."
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={applyLeave.isPending}>
            {applyLeave.isPending ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
