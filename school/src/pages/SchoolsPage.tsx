import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useStudents } from "../hooks/useStudents";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { FormField } from "../components/ui/FormField";
import { Alert } from "../components/ui/Alert";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PermissionGate } from "../components/auth/PermissionGate";
import { Plus, Pencil, Trash2, Calendar, ArrowUpCircle, CheckCircle2, Lock, Unlock } from "lucide-react";
import type { School, Session } from "../types";
import { SUPER_ADMIN_ROLE_NAME } from "../types/auth";
import { isSessionCompleted } from "../lib/utils";

export function SchoolsPage() {
  const { user } = useAuth();
  const {
    schools,
    sessions,
    organizations,
    selectedSchoolId,
    addSchool,
    updateSchool,
    deleteSchool,
    addSession,
    updateSession,
    deleteSession,
    promoteStudentsToNewSession,
    toast,
  } = useApp();
  const { data: students = [] } = useStudents();
  const [schoolModal, setSchoolModal] = useState<{ open: boolean; school?: School }>({ open: false });
  const [sessionModal, setSessionModal] = useState<{ open: boolean; session?: Session; schoolId?: string }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<{ type: "school" | "session"; id: string; name: string } | null>(null);
  const [promoteModal, setPromoteModal] = useState<{ open: boolean; fromSession?: Session } | null>(null);
  const [orgFilterId, setOrgFilterId] = useState<string | null>(null);

  const isSuperAdmin = user?.role?.name === SUPER_ADMIN_ROLE_NAME;

  // Super Admin: filter schools (and their sessions) by selected org. Others: show all they have access to.
  const displaySchools = isSuperAdmin && orgFilterId
    ? schools.filter((s) => s.organizationId === orgFilterId)
    : schools;
  const displaySessions = isSuperAdmin && orgFilterId
    ? sessions.filter((s) => displaySchools.some((sc) => sc.id === s.schoolId))
    : sessions;

  // Get sessions grouped by school (use displaySessions so promote modal sees filtered list)
  const getSessionsForSchool = (schoolId: string) =>
    displaySessions.filter((s) => s.schoolId === schoolId).sort((a, b) => b.year.localeCompare(a.year));

  // Get student count for a session
  const getStudentCount = (sessionId: string) =>
    students.filter((s) => s.sessionId === sessionId).length;

  const handleSaveSchool = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const address = (form.elements.namedItem("address") as HTMLInputElement).value.trim();
    const contact = (form.elements.namedItem("contact") as HTMLInputElement).value.trim();
    if (!name) return;
    if (schoolModal.school) {
      updateSchool(schoolModal.school.id, { name, address, contact });
      toast("School updated");
    } else {
      const organizationId = isSuperAdmin
        ? (form.elements.namedItem("organizationId") as HTMLSelectElement)?.value
        : user?.organizationId ?? undefined;
      if (isSuperAdmin && !organizationId) {
        toast("Please select an organization", "error");
        return;
      }
      addSchool({ name, address, contact, organizationId: organizationId || undefined });
      toast("School added");
    }
    setSchoolModal({ open: false });
  };

  const handleSaveSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const schoolId = (form.elements.namedItem("schoolId") as HTMLSelectElement).value;
    const year = (form.elements.namedItem("year") as HTMLInputElement).value.trim();
    const startDate = (form.elements.namedItem("startDate") as HTMLInputElement).value;
    const endDate = (form.elements.namedItem("endDate") as HTMLInputElement).value;
    const salaryDueDayRaw = (form.elements.namedItem("salaryDueDay") as HTMLInputElement).value;
    const salaryDueDay = salaryDueDayRaw ? Math.min(28, Math.max(1, parseInt(salaryDueDayRaw, 10))) : undefined;
    if (!schoolId || !year || !startDate || !endDate) return;
    if (sessionModal.session) {
      updateSession(sessionModal.session.id, { schoolId, year, startDate, endDate, salaryDueDay });
      toast("Session updated");
    } else {
      addSession({ schoolId, year, startDate, endDate, salaryDueDay });
      toast("Session added");
    }
    setSessionModal({ open: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Schools & Sessions</h2>
          <p className="text-slate-600 dark:text-slate-400">
            {isSuperAdmin ? "Manage schools and sessions across organizations" : "Manage schools and academic sessions"}
          </p>
        </div>
        {isSuperAdmin && organizations.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="schools-org-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Organization
            </label>
            <Select
              id="schools-org-filter"
              value={orgFilterId ?? ""}
              onChange={(e) => setOrgFilterId(e.target.value || null)}
              className="w-auto min-w-[180px]"
            >
              <option value="">All organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Schools</CardTitle>
            <PermissionGate permission="schools:create">
              <Button size="sm" onClick={() => setSchoolModal({ open: true })}>
                <Plus className="mr-1 h-4 w-4" />
                Add school
              </Button>
            </PermissionGate>
          </CardHeader>
          <CardContent>
            {displaySchools.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isSuperAdmin && orgFilterId ? "No schools in this organization." : "No schools yet. Add one to get started."}
              </p>
            ) : (
              <ul className="space-y-2">
                {displaySchools.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 p-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {s.address}
                        {isSuperAdmin && s.organizationId && (
                          <span className="ml-1">
                            · {organizations.find((o) => o.id === s.organizationId)?.name ?? "—"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {s.isLocked ? (
                        <span className="rounded bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">Locked</span>
                      ) : null}
                      <PermissionGate permission="app:lock">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSchool(s.id, { isLocked: !s.isLocked })}
                          aria-label={s.isLocked ? "Unlock school" : "Lock school"}
                          title={s.isLocked ? "Unlock school for all users" : "Lock app for this school (only you can unlock)"}
                        >
                          {s.isLocked ? <Unlock className="h-4 w-4 text-amber-600 dark:text-amber-400" /> : <Lock className="h-4 w-4 text-slate-600 dark:text-slate-300" />}
                        </Button>
                      </PermissionGate>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSchoolModal({ open: true, school: s })}
                        aria-label="Edit school"
                      >
                        <Pencil className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDelete({ type: "school", id: s.id, name: s.name })}
                        aria-label="Delete school"
                        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sessions</CardTitle>
            <PermissionGate permission="sessions:create">
              <Button
                size="sm"
                onClick={() =>
                  setSessionModal({
                    open: true,
                    schoolId: selectedSchoolId ?? undefined,
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add session
              </Button>
            </PermissionGate>
          </CardHeader>
          <CardContent>
            {displaySessions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isSuperAdmin && orgFilterId ? "No sessions in this organization." : "No sessions. Add a session for a school."}
              </p>
            ) : (
              <ul className="space-y-2">
                {displaySessions.map((s) => {
                  const school = displaySchools.find((sc) => sc.id === s.schoolId);
                  const studentCount = getStudentCount(s.id);
                  const completed = isSessionCompleted(s.endDate);
                  const schoolSessions = getSessionsForSchool(s.schoolId);
                  const hasNewerSession = schoolSessions.some((ss) => ss.year > s.year);
                  
                  return (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-300" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{s.year}</p>
                            {completed && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/50 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                                <CheckCircle2 className="h-3 w-3" />
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {school?.name}
                            {isSuperAdmin && school?.organizationId && (
                              <> · {organizations.find((o) => o.id === school.organizationId)?.name ?? "—"}</>
                            )}
                            {" · "}
                            {studentCount} student{studentCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {studentCount > 0 && hasNewerSession && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPromoteModal({ open: true, fromSession: s })}
                            aria-label="Promote students to next session"
                            title="Promote students to next session"
                            className="text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSessionModal({ open: true, session: s, schoolId: s.schoolId })
                          }
                          aria-label="Edit session"
                        >
                          <Pencil className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setConfirmDelete({ type: "session", id: s.id, name: `${s.year} (${school?.name})` })
                          }
                          aria-label="Delete session"
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={schoolModal.open}
        onClose={() => setSchoolModal({ open: false })}
        title={schoolModal.school ? "Edit school" : "Add school"}
      >
        <form onSubmit={handleSaveSchool} className="space-y-4">
          {!schoolModal.school && isSuperAdmin && organizations.length > 0 && (
            <FormField label="Organization" required helperText="Create an organization first under Organizations if the list is empty.">
              <Select name="organizationId" required>
                <option value="">Select organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
          {!schoolModal.school && isSuperAdmin && organizations.length === 0 && (
            <Alert variant="warning">Create at least one organization first (Organizations in the sidebar).</Alert>
          )}
          <FormField label="Name" required>
            <Input name="name" type="text" required defaultValue={schoolModal.school?.name} />
          </FormField>
          <FormField label="Address">
            <Input name="address" type="text" defaultValue={schoolModal.school?.address} />
          </FormField>
          <FormField label="Contact">
            <Input name="contact" type="text" defaultValue={schoolModal.school?.contact} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSchoolModal({ open: false })}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={sessionModal.open}
        onClose={() => setSessionModal({ open: false })}
        title={sessionModal.session ? "Edit session" : "Add session"}
      >
        <form onSubmit={handleSaveSession} className="space-y-4">
          <FormField label="School" required>
            <Select
              name="schoolId"
              required
              defaultValue={sessionModal.session?.schoolId ?? sessionModal.schoolId ?? displaySchools[0]?.id}
            >
              {displaySchools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {isSuperAdmin && s.organizationId ? ` (${organizations.find((o) => o.id === s.organizationId)?.name ?? "—"})` : ""}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Year (e.g. 2024-2025)" required>
            <Input
              name="year"
              type="text"
              required
              placeholder="2024-2025"
              defaultValue={sessionModal.session?.year}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start date" required>
              <Input
                name="startDate"
                type="date"
                required
                defaultValue={sessionModal.session?.startDate}
              />
            </FormField>
            <FormField label="End date" required>
              <Input
                name="endDate"
                type="date"
                required
                defaultValue={sessionModal.session?.endDate}
              />
            </FormField>
          </div>
          <FormField
            label="Salary due day (1–28)"
            helperText="Day of month when staff salary is due. Payments after this day are marked late."
          >
            <Input
              name="salaryDueDay"
              type="number"
              min={1}
              max={28}
              placeholder="5"
              defaultValue={sessionModal.session?.salaryDueDay ?? 5}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSessionModal({ open: false })}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          if (confirmDelete.type === "school") deleteSchool(confirmDelete.id);
          else deleteSession(confirmDelete.id);
          toast("Deleted");
          setConfirmDelete(null);
        }}
        title="Confirm delete"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This will also remove all related sessions, students, staff and expenses.`}
        confirmLabel="Delete"
      />

      {/* Promote Students Modal */}
      {promoteModal?.open && promoteModal.fromSession && (
        <Modal
          open={promoteModal.open}
          onClose={() => setPromoteModal(null)}
          title="Promote Students to Next Session"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const toSessionId = (form.elements.namedItem("toSession") as HTMLSelectElement).value;
              if (!toSessionId || !promoteModal.fromSession) return;

              const result = await promoteStudentsToNewSession(promoteModal.fromSession.id, toSessionId);

              if (result.promoted > 0 || result.graduated > 0) {
                toast(
                  `${result.promoted} student${result.promoted !== 1 ? "s" : ""} promoted` +
                  (result.graduated > 0 ? `, ${result.graduated} graduated (Class 12 completed)` : "")
                );
              } else {
                toast("No students to promote", "error");
              }
              setPromoteModal(null);
            }}
            className="space-y-4"
          >
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Students will be automatically promoted to the next class 
                (e.g., Class 1 → Class 2, Nursery → LKG). Students in Class 12 will be marked as graduated 
                and won't be promoted.
              </p>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                From Session
              </label>
              <p className="text-sm text-slate-600">
                {promoteModal.fromSession.year} ({getStudentCount(promoteModal.fromSession.id)} students)
              </p>
            </div>
            
            <FormField label="Promote to Session *" required>
              <Select
                name="toSession"
                required
              >
                <option value="">Select target session</option>
                {getSessionsForSchool(promoteModal.fromSession.schoolId)
                  .filter((s) => s.year > promoteModal.fromSession!.year)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.year} ({getStudentCount(s.id)} students)
                    </option>
                  ))}
              </Select>
            </FormField>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setPromoteModal(null)}>
                Cancel
              </Button>
              <Button type="submit">
                <ArrowUpCircle className="mr-1 h-4 w-4" />
                Promote Students
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
