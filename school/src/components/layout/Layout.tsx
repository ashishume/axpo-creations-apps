import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar, type PageId, PAGE_PATHS } from "./Sidebar";
import { ToastContainer } from "../ui/Toast";
import { useApp } from "../../context/AppContext";
import type { BackupData } from "../../context/AppContext";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import { Menu, Lock } from "lucide-react";
import { DashboardPage } from "../../pages/DashboardPage";
import { OrganizationsPage } from "../../pages/OrganizationsPage";
import { SchoolsPage } from "../../pages/SchoolsPage";
import { StudentsPage } from "../../pages/StudentsPage";
import { StaffPage } from "../../pages/StaffPage";
import { ExpensesPage } from "../../pages/ExpensesPage";
import { StocksPage } from "../../pages/StocksPage";
import { LeavesPage } from "../../pages/LeavesPage";
import { YearReportPage } from "../../pages/YearReportPage";
import { UsersPage } from "../../pages/UsersPage";
import { RolesPage } from "../../pages/RolesPage";
import { SubscriptionPage } from "../../pages/SubscriptionPage";
import { OrgSubscriptionsPage } from "../../pages/OrgSubscriptionsPage";
import { AxpoAssistantPage } from "../../pages/AxpoAssistantPage";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { AssistantPopup } from "../assistant/AssistantPopup";
import { SubscriptionExpiredOverlay } from "../SubscriptionExpiredOverlay";

const PAGES: Record<PageId, React.ReactNode> = {
  dashboard: <DashboardPage />,
  organizations: <OrganizationsPage />,
  orgSubscriptions: <OrgSubscriptionsPage />,
  schools: <SchoolsPage />,
  students: <StudentsPage />,
  staff: <StaffPage />,
  expenses: <ExpensesPage />,
  stocks: <StocksPage />,
  leaves: <LeavesPage />,
  report: <YearReportPage />,
  users: <UsersPage />,
  roles: <RolesPage />,
  subscription: <SubscriptionPage />,
  assistant: <AxpoAssistantPage />,
};

const PATH_TO_PAGE: Record<string, PageId> = Object.fromEntries(
  (Object.entries(PAGE_PATHS) as [PageId, string][]).map(([id, path]) => [
    path === "/" ? "" : path.replace(/^\//, ""),
    id,
  ])
) as Record<string, PageId>;

function pathnameToPage(pathname: string): PageId {
  const segment = pathname.replace(/^\//, "").split("/")[0] || "";
  return PATH_TO_PAGE[segment] ?? "dashboard";
}

export function Layout() {
  const { pathname } = useLocation();
  const page = pathnameToPage(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loadSampleData, clearAllData, exportData, importData, toast, schools, sessions, selectedSchoolId, selectedSessionId } = useApp();
  const { hasPermission } = useAuth();
  const selectedSchool = selectedSchoolId ? schools.find((s) => s.id === selectedSchoolId) : null;
  const isAppLocked = selectedSchool?.isLocked && !hasPermission("app:lock");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadSample = () => {
    loadSampleData();
    toast("Sample data loaded");
  };

  const handleClearConfirm = () => {
    clearAllData();
    toast("All data cleared");
    setShowClearConfirm(false);
  };

  const handleBackup = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sfms-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup downloaded");
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as BackupData;
        if (
          data &&
          Array.isArray(data.schools) &&
          Array.isArray(data.sessions) &&
          Array.isArray(data.students) &&
          Array.isArray(data.staff) &&
          Array.isArray(data.expenses)
        ) {
          setPendingRestoreData(data);
          setShowRestoreConfirm(true);
        } else {
          toast("Invalid backup file", "error");
        }
      } catch {
        toast("Invalid JSON file", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreConfirm = () => {
    if (pendingRestoreData) {
      importData(pendingRestoreData);
      toast("Data restored");
      setPendingRestoreData(null);
      setShowRestoreConfirm(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-900">
      <SubscriptionExpiredOverlay />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleRestoreFileChange}
      />
      {/* Mobile sidebar backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        className={cn(
          "no-print fixed inset-0 z-40 bg-slate-900/50 dark:bg-slate-950/70 transition-opacity md:hidden",
          sidebarOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col overflow-hidden border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-transform duration-200 ease-out md:static md:translate-x-0 md:transition-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          onLoadSample={handleLoadSample}
          onClearData={() => setShowClearConfirm(true)}
          onBackup={handleBackup}
          onRestore={handleRestoreClick}
          onNavClick={() => setSidebarOpen(false)}
        />
      </div>
      <main className="flex min-h-0 flex-1 flex-col overflow-auto">
        {isAppLocked ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">App locked</h2>
            <p className="max-w-md text-center text-slate-600 dark:text-slate-400">
              This school is currently locked. Only a Super Admin can unlock it. Please contact your administrator.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{selectedSchool?.name}</p>
          </div>
        ) : (
          <>
            {/* Mobile only: thin bar with menu button to open sidebar (school/session are in sidebar) */}
            <div className="no-print sticky top-0 z-30 flex shrink-0 md:hidden items-center border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-3 py-2 backdrop-blur">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 touch-manipulation"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <span className="ml-2 truncate text-sm text-slate-500 dark:text-slate-400">
                {selectedSchool?.name ?? "Select school"}
                {selectedSchoolId && " • "}
                {selectedSchoolId && (sessions.find((s) => s.id === selectedSessionId)?.year ?? "Select session")}
              </span>
            </div>
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col min-h-[calc(100vh-8rem)]",
                page === "assistant"
                  ? "w-full max-w-full"
                  : "w-full max-w-6xl mx-auto flex-1 p-4 sm:p-6"
              )}
            >
              {PAGES[page]}
            </div>
          </>
        )}
      </main>
      <ToastContainer />
      <AssistantPopup />
      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearConfirm}
        title="Clear all data?"
        message="This will permanently remove all schools, sessions, students, staff and expenses. This cannot be undone."
        confirmLabel="Clear all"
        variant="danger"
      />
      <ConfirmDialog
        open={showRestoreConfirm}
        onClose={() => {
          setShowRestoreConfirm(false);
          setPendingRestoreData(null);
        }}
        onConfirm={handleRestoreConfirm}
        title="Restore backup?"
        message="This will replace all current data with the backup. Current data cannot be recovered."
        confirmLabel="Restore"
        variant="danger"
      />
    </div>
  );
}
