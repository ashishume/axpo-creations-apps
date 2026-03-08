import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Skeleton, SkeletonTable } from "../components/ui/Skeleton";
import {
  useLeaveTypes,
  useLeaveRequests,
  useLeaveBalances,
  useApplyLeave,
  useApproveLeave,
  useRejectLeave,
  useCancelLeave,
  useCreateLeaveType,
  useDeleteLeaveType,
  useInitializeLeaveBalances,
} from "../hooks/useLeaves";
import { ApplyLeaveModal } from "../components/leaves/ApplyLeaveModal";
import { ReviewLeaveModal } from "../components/leaves/ReviewLeaveModal";
import { LeaveTypeModal } from "../components/leaves/LeaveTypeModal";
import { Plus, CalendarOff, CheckCircle, XCircle, Clock, UserCog, User } from "lucide-react";
import { formatDate } from "../lib/utils";
import { SearchInput } from "../components/ui/SearchInput";
import { FilterChips } from "../components/ui/FilterChips";
import { PermissionGate } from "../components/auth/PermissionGate";
import { cn } from "../lib/utils";
import type { LeaveRequest as LeaveRequestType, LeaveType as LeaveTypeEntity } from "../types";

type TabId = "requests" | "types" | "balances";

const statusColors: Record<LeaveRequestType["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-600",
};

export function LeavesPage() {
  const { sessions, staff, students, selectedSessionId, isAppLoading, toast } = useApp();
  const { user, hasPermission } = useAuth();
  const selectedSession = useMemo(
    () => (selectedSessionId ? sessions.find((s) => s.id === selectedSessionId) : null),
    [sessions, selectedSessionId]
  );
  const sessionYear = selectedSession?.year ?? "";

  const [activeTab, setActiveTab] = useState<TabId>("requests");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [applicantFilter, setApplicantFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<LeaveRequestType | null>(null);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveTypeEntity | null>(null);
  const [balancesStaffId, setBalancesStaffId] = useState<string>("");
  const [balancesYear, setBalancesYear] = useState<string>("");

  const { data: leaveTypes = [], isLoading: typesLoading } = useLeaveTypes(
    selectedSessionId ?? "",
    undefined
  );
  const { data: leaveRequests = [], isLoading: requestsLoading } = useLeaveRequests(
    selectedSessionId ?? "",
    { status: statusFilter || undefined, applicantType: applicantFilter || undefined }
  );
  const staffLeaveTypes = useMemo(
    () => leaveTypes.filter((t) => t.applicableTo === "staff" || t.applicableTo === "both"),
    [leaveTypes]
  );
  const { data: leaveBalances = [] } = useLeaveBalances(
    balancesStaffId,
    balancesYear || sessionYear,
    { enabled: !!balancesStaffId }
  );

  const applyLeaveMutation = useApplyLeave();
  const approveLeaveMutation = useApproveLeave();
  const rejectLeaveMutation = useRejectLeave();
  const cancelLeaveMutation = useCancelLeave();
  const createLeaveTypeMutation = useCreateLeaveType();
  const deleteLeaveTypeMutation = useDeleteLeaveType();
  const initializeBalancesMutation = useInitializeLeaveBalances();

  const sessionStaff = useMemo(
    () => (selectedSessionId ? staff.filter((s) => s.sessionId === selectedSessionId) : []),
    [staff, selectedSessionId]
  );
  const sessionStudents = useMemo(
    () => (selectedSessionId ? students.filter((s) => s.sessionId === selectedSessionId) : []),
    [students, selectedSessionId]
  );

  const filteredRequests = useMemo(() => {
    let out = leaveRequests;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => {
        const name =
          r.applicantType === "staff"
            ? sessionStaff.find((s) => s.id === r.staffId)?.name
            : sessionStudents.find((s) => s.id === r.studentId)?.name;
        const typeName = r.leaveType?.name ?? "";
        return (name?.toLowerCase().includes(q) ?? false) || typeName.toLowerCase().includes(q);
      });
    }
    return out;
  }, [leaveRequests, searchQuery, sessionStaff, sessionStudents]);

  const getApplicantName = (r: LeaveRequestType) => {
    if (r.applicantType === "staff" && r.staffId)
      return sessionStaff.find((s) => s.id === r.staffId)?.name ?? "—";
    if (r.applicantType === "student" && r.studentId)
      return sessionStudents.find((s) => s.id === r.studentId)?.name ?? "—";
    return "—";
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "requests", label: "Leave Requests" },
    { id: "types", label: "Leave Types" },
    { id: "balances", label: "Leave Balances" },
  ];

  if (!selectedSessionId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Leave Management</h2>
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Select a school and session to manage leave.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Leave Management</h2>
          <p className="text-slate-600">Apply for leave, review requests, and manage leave types</p>
        </div>
        {activeTab === "requests" && hasPermission("leaves:create") && (
          <Button size="sm" onClick={() => setApplyModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Apply for leave
          </Button>
        )}
        {activeTab === "types" && hasPermission("leaves:manage") && (
          <Button size="sm" onClick={() => { setEditingType(null); setTypeModalOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" />
            Add leave type
          </Button>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "requests" && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests ({filteredRequests.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name or leave type..."
                className="max-w-xs"
              />
              <FilterChips
                options={[
                  { value: "", label: "All status" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
              <FilterChips
                options={[
                  { value: "", label: "All" },
                  { value: "staff", label: "Staff" },
                  { value: "student", label: "Student" },
                ]}
                value={applicantFilter}
                onChange={setApplicantFilter}
              />
            </div>
            {requestsLoading ? (
              <SkeletonTable rows={5} columns={7} />
            ) : filteredRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No leave requests match your filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="pb-2 pr-4 font-medium">Applicant</th>
                      <th className="pb-2 pr-4 font-medium">Type</th>
                      <th className="pb-2 pr-4 font-medium">From</th>
                      <th className="pb-2 pr-4 font-medium">To</th>
                      <th className="pb-2 pr-4 font-medium">Days</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1 text-slate-900">
                            {r.applicantType === "staff" ? (
                              <UserCog className="h-4 w-4 text-slate-400" />
                            ) : (
                              <User className="h-4 w-4 text-slate-400" />
                            )}
                            {getApplicantName(r)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{r.leaveType?.name ?? "—"}</td>
                        <td className="py-3 pr-4">{formatDate(r.fromDate)}</td>
                        <td className="py-3 pr-4">{formatDate(r.toDate)}</td>
                        <td className="py-3 pr-4">{r.daysCount}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              statusColors[r.status as LeaveRequestType["status"]] ?? "bg-slate-100 text-slate-600"
                            )}
                          >
                            {r.status === "pending" && <Clock className="h-3 w-3" />}
                            {r.status === "approved" && <CheckCircle className="h-3 w-3" />}
                            {r.status === "rejected" && <XCircle className="h-3 w-3" />}
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            {r.status === "pending" && hasPermission("leaves:approve") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReviewRequest(r)}
                              >
                                Review
                              </Button>
                            )}
                            {r.status === "pending" && hasPermission("leaves:create") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  cancelLeaveMutation.mutate(r.id);
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "types" && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Types ({leaveTypes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {typesLoading ? (
              <SkeletonTable rows={4} columns={5} />
            ) : leaveTypes.length === 0 ? (
              <p className="text-sm text-slate-500">No leave types. Add one to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="pb-2 pr-4 font-medium">Name</th>
                      <th className="pb-2 pr-4 font-medium">Code</th>
                      <th className="pb-2 pr-4 font-medium">Applicable to</th>
                      <th className="pb-2 pr-4 font-medium">Max days/year</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveTypes.map((lt) => (
                      <tr key={lt.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-medium text-slate-900">{lt.name}</td>
                        <td className="py-3 pr-4 text-slate-600">{lt.code}</td>
                        <td className="py-3 pr-4">{lt.applicableTo}</td>
                        <td className="py-3 pr-4">{lt.maxDaysPerYear ?? "—"}</td>
                        <td className="py-3">
                          {hasPermission("leaves:manage") && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingType(lt);
                                  setTypeModalOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => deleteLeaveTypeMutation.mutate(lt.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "balances" && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasPermission("leaves:manage") && (
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={balancesStaffId}
                  onChange={(e) => setBalancesStaffId(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select staff</option>
                  {sessionStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.employeeId})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={balancesYear}
                  onChange={(e) => setBalancesYear(e.target.value)}
                  placeholder="Year e.g. 2024-2025"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-32"
                />
                <Button
                  size="sm"
                  disabled={!balancesStaffId || (!balancesYear && !sessionYear) || initializeBalancesMutation.isPending}
                  onClick={() => {
                    if (!balancesStaffId || !(balancesYear || sessionYear)) return;
                    if (staffLeaveTypes.length === 0) {
                      toast(
                        "No staff leave types configured. Add leave types in the Leave Types tab first.",
                        "error"
                      );
                      return;
                    }
                    initializeBalancesMutation.mutate(
                      {
                        staffId: balancesStaffId,
                        sessionId: selectedSessionId!,
                        year: balancesYear || sessionYear,
                      },
                      {
                        onSuccess: () =>
                          toast("Leave balances initialized for this staff/year."),
                        onError: (err) =>
                          toast(err instanceof Error ? err.message : "Failed to initialize balances", "error"),
                      }
                    );
                  }}
                >
                  {initializeBalancesMutation.isPending ? "Initializing…" : "Initialize balances"}
                </Button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="pb-2 pr-4 font-medium">Leave type</th>
                    <th className="pb-2 pr-4 font-medium">Year</th>
                    <th className="pb-2 pr-4 font-medium">Total</th>
                    <th className="pb-2 pr-4 font-medium">Used</th>
                    <th className="pb-2 font-medium">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveBalances.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-900">{b.leaveType?.name ?? b.leaveTypeId}</td>
                      <td className="py-3 pr-4 text-slate-600">{b.year}</td>
                      <td className="py-3 pr-4">{b.totalDays}</td>
                      <td className="py-3 pr-4">{b.usedDays}</td>
                      <td className="py-3">{b.totalDays - b.usedDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!balancesStaffId && hasPermission("leaves:manage") && (
              <p className="text-sm text-slate-500">Select a staff member to view leave balances.</p>
            )}
            {balancesStaffId && leaveBalances.length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Leave balances are not initialized for this staff/year.{" "}
                {staffLeaveTypes.length === 0
                  ? "Add leave types in the Leave Types tab first, then click Initialize balances."
                  : "Click Initialize balances above to create them."}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ApplyLeaveModal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        sessionId={selectedSessionId!}
        sessionYear={sessionYear}
        leaveTypes={leaveTypes}
        staff={sessionStaff}
        students={sessionStudents}
        currentUser={user}
        onSuccess={() => setApplyModalOpen(false)}
        onError={(msg) => toast(msg, "error")}
      />

      <LeaveTypeModal
        open={typeModalOpen}
        onClose={() => { setTypeModalOpen(false); setEditingType(null); }}
        sessionId={selectedSessionId!}
        leaveType={editingType}
        onSuccess={() => { setTypeModalOpen(false); setEditingType(null); }}
        onError={(msg) => toast(msg, "error")}
      />

      {reviewRequest && (
        <ReviewLeaveModal
          open={!!reviewRequest}
          request={reviewRequest}
          applicantName={getApplicantName(reviewRequest)}
          onClose={() => setReviewRequest(null)}
          onApprove={(remarks) => {
            approveLeaveMutation.mutate({
              id: reviewRequest.id,
              remarks,
              reviewedBy: user?.id,
            });
            setReviewRequest(null);
          }}
          onReject={(remarks) => {
            rejectLeaveMutation.mutate({
              id: reviewRequest.id,
              remarks,
              reviewedBy: user?.id,
            });
            setReviewRequest(null);
          }}
        />
      )}
    </div>
  );
}
