import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { formatDate } from "../../lib/utils";
import type { LeaveRequest } from "../../types";

interface ReviewLeaveModalProps {
  open: boolean;
  request: LeaveRequest;
  applicantName: string;
  onClose: () => void;
  onApprove: (remarks?: string) => void;
  onReject: (remarks: string) => void;
}

export function ReviewLeaveModal({
  open,
  request,
  applicantName,
  onClose,
  onApprove,
  onReject,
}: ReviewLeaveModalProps) {
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleApprove = () => {
    setAction("approve");
    onApprove(remarks.trim() || undefined);
  };

  const handleReject = () => {
    if (!remarks.trim()) {
      return;
    }
    setAction("reject");
    onReject(remarks.trim());
  };

  return (
    <Modal open={open} onClose={onClose} title="Review leave request">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700">Applicant</p>
          <p className="text-slate-900">{applicantName}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Leave type</p>
          <p className="text-slate-900">{request.leaveType?.name ?? "—"}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-slate-700">From</p>
            <p className="text-slate-900">{formatDate(request.fromDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">To</p>
            <p className="text-slate-900">{formatDate(request.toDate)}</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Days</p>
          <p className="text-slate-900">{request.daysCount}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Reason</p>
          <p className="text-slate-900 whitespace-pre-wrap">{request.reason}</p>
        </div>
        {request.documentUrl && (
          <div>
            <p className="text-sm font-medium text-slate-700">Document</p>
            <a
              href={request.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline text-sm"
            >
              View document
            </a>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Remarks (optional for approve, required for reject)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Add remarks..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="bg-red-50 text-red-700 hover:bg-red-100"
            onClick={handleReject}
            disabled={!remarks.trim() || action !== null}
          >
            Reject
          </Button>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={action !== null}
          >
            Approve
          </Button>
        </div>
      </div>
    </Modal>
  );
}
