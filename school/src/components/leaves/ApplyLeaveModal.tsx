import { useState, useMemo } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useApplyLeave } from "../../hooks/useLeaves";
import type { LeaveType, Staff, Student } from "../../types";
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

  const applyLeave = useApplyLeave();

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

  const preselectedStaffId = currentUser?.staffId ?? "";
  const preselectedStudentId = currentUser?.studentId ?? "";

  return (
    <Modal open={open} onClose={onClose} title="Apply for leave">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Applicant type</label>
          <select
            value={applicantType}
            onChange={(e) => {
              setApplicantType(e.target.value as "staff" | "student");
              setStaffId("");
              setStudentId("");
              setLeaveTypeId("");
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="staff">Staff</option>
            <option value="student">Student</option>
          </select>
        </div>

        {applicantType === "staff" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Staff member</label>
            <select
              value={staffId || preselectedStaffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">Select staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.employeeId})
                </option>
              ))}
            </select>
          </div>
        )}
        {applicantType === "student" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Student</label>
            <select
              value={studentId || preselectedStudentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentId})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Leave type</label>
          <select
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          >
            <option value="">Select leave type</option>
            {applicableTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name} ({lt.code})
                {lt.maxDaysPerYear != null ? ` — max ${lt.maxDaysPerYear} days/year` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
        </div>
        {fromDate && toDate && daysCount > 0 && (
          <p className="text-sm text-slate-500">Total days: {daysCount}</p>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Reason for leave"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Document URL (optional)</label>
          <input
            type="url"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>

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
