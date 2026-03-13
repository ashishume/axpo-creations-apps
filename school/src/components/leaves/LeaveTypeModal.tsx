import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { FormField } from "../ui/FormField";
import { Checkbox } from "../ui/Checkbox";
import { useCreateLeaveType, useUpdateLeaveType } from "../../hooks/useLeaves";
import { STAFF_ROLES } from "../../constants/staffRoles";
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
  const [roleOverrides, setRoleOverrides] = useState<{ role: string; days: string }[]>([]);
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
      setRoleOverrides(
        leaveType.maxDaysByRole && Object.keys(leaveType.maxDaysByRole).length > 0
          ? Object.entries(leaveType.maxDaysByRole).map(([role, days]) => ({ role, days: String(days) }))
          : []
      );
      setRequiresDocument(leaveType.requiresDocument);
      setIsActive(leaveType.isActive);
    } else {
      setName("");
      setCode("");
      setApplicableTo("both");
      setMaxDaysPerYear("");
      setRoleOverrides([]);
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
    const maxDaysByRole: Record<string, number> = {};
    for (const { role, days } of roleOverrides) {
      if (!role.trim()) continue;
      const n = days.trim() ? parseInt(days, 10) : NaN;
      if (Number.isInteger(n) && n >= 0) maxDaysByRole[role.trim()] = n;
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
            maxDaysByRole: Object.keys(maxDaysByRole).length > 0 ? maxDaysByRole : undefined,
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
          maxDaysByRole: Object.keys(maxDaysByRole).length > 0 ? maxDaysByRole : undefined,
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
        <FormField label="Name" required>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sick Leave"
            required
          />
        </FormField>
        <FormField label="Code" required>
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. SL"
            required
          />
        </FormField>
        <FormField label="Applicable to">
          <Select
            value={applicableTo}
            onChange={(e) => setApplicableTo(e.target.value as "staff" | "student" | "both")}
          >
            <option value="staff">Staff</option>
            <option value="student">Student</option>
            <option value="both">Both</option>
          </Select>
        </FormField>
        <FormField label="Max days per year (default)">
          <Input
            type="number"
            min={0}
            value={maxDaysPerYear}
            onChange={(e) => setMaxDaysPerYear(e.target.value)}
            placeholder="Default for all staff; overridden by role below if set"
          />
        </FormField>
        {(applicableTo === "staff" || applicableTo === "both") && (
          <FormField label="Max days by staff role (optional)">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Set different leave days per staff type. Unset roles use the default above.
            </p>
            <div className="space-y-2">
              {roleOverrides.map((row, i) => (
                <div key={i} className="flex gap-2 items-center flex-wrap">
                  <Select
                    value={row.role}
                    onChange={(e) =>
                      setRoleOverrides((prev) =>
                        prev.map((r, j) => (j === i ? { ...r, role: e.target.value } : r))
                      )
                    }
                    className="min-w-[140px]"
                  >
                    <option value="">Select role</option>
                    {STAFF_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    className="w-20"
                    placeholder="Days"
                    value={row.days}
                    onChange={(e) =>
                      setRoleOverrides((prev) =>
                        prev.map((r, j) => (j === i ? { ...r, days: e.target.value } : r))
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setRoleOverrides((prev) => prev.filter((_, j) => j !== i))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRoleOverrides((prev) => [...prev, { role: "", days: "" }])}
              >
                Add role override
              </Button>
            </div>
          </FormField>
        )}
        <Checkbox
          id="requiresDocument"
          label="Requires document"
          checked={requiresDocument}
          onChange={(e) => setRequiresDocument(e.target.checked)}
        />
        <Checkbox
          id="isActive"
          label="Active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
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
