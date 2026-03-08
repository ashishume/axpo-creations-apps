import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useCreateLeaveType, useUpdateLeaveType } from "../../hooks/useLeaves";
import type { LeaveType } from "../../types";

interface LeaveTypeModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  leaveType: LeaveType | null;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function LeaveTypeModal({
  open,
  onClose,
  sessionId,
  leaveType,
  onSuccess,
  onError,
}: LeaveTypeModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [applicableTo, setApplicableTo] = useState<"staff" | "student" | "both">("both");
  const [maxDaysPerYear, setMaxDaysPerYear] = useState<string>("");
  const [requiresDocument, setRequiresDocument] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateLeaveType();
  const updateMutation = useUpdateLeaveType();

  useEffect(() => {
    if (leaveType) {
      setName(leaveType.name);
      setCode(leaveType.code);
      setApplicableTo(leaveType.applicableTo);
      setMaxDaysPerYear(leaveType.maxDaysPerYear != null ? String(leaveType.maxDaysPerYear) : "");
      setRequiresDocument(leaveType.requiresDocument);
      setIsActive(leaveType.isActive);
    } else {
      setName("");
      setCode("");
      setApplicableTo("both");
      setMaxDaysPerYear("");
      setRequiresDocument(false);
      setIsActive(true);
    }
  }, [leaveType, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      onError("Name and code are required.");
      return;
    }
    try {
      if (leaveType) {
        await updateMutation.mutateAsync({
          id: leaveType.id,
          data: {
            name: name.trim(),
            code: code.trim(),
            applicableTo,
            maxDaysPerYear: maxDaysPerYear ? parseInt(maxDaysPerYear, 10) : undefined,
            requiresDocument,
            isActive,
          },
        });
      } else {
        await createMutation.mutateAsync({
          sessionId,
          name: name.trim(),
          code: code.trim(),
          applicableTo,
          maxDaysPerYear: maxDaysPerYear ? parseInt(maxDaysPerYear, 10) : undefined,
          requiresDocument,
          isActive,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save leave type");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal open={open} onClose={onClose} title={leaveType ? "Edit leave type" : "Add leave type"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g. Sick Leave"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g. SL"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Applicable to</label>
          <select
            value={applicableTo}
            onChange={(e) => setApplicableTo(e.target.value as "staff" | "student" | "both")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="staff">Staff</option>
            <option value="student">Student</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Max days per year (optional)</label>
          <input
            type="number"
            min={0}
            value={maxDaysPerYear}
            onChange={(e) => setMaxDaysPerYear(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Leave empty for unlimited"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="requiresDocument"
            checked={requiresDocument}
            onChange={(e) => setRequiresDocument(e.target.checked)}
            className="rounded border-slate-300"
          />
          <label htmlFor="requiresDocument" className="text-sm text-slate-700">
            Requires document
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-slate-300"
          />
          <label htmlFor="isActive" className="text-sm text-slate-700">
            Active
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : leaveType ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
