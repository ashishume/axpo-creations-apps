import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import {
  LayoutDashboard,
  School,
  Users,
  UserCog,
  Receipt,
  FileText,
  Loader2,
  Trash2,
  Download,
  Upload,
  Package,
  Shield,
  UserPlus,
  LogOut,
  Building2,
  Bot,
  Calendar,
  CalendarOff,
  CreditCard,
} from "lucide-react";
import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { PermissionGate } from "../auth/PermissionGate";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { planIncludesAssistant } from "../../lib/plans";
import { SUPER_ADMIN_ROLE_NAME, type Permission } from "../../types/auth";

export type PageId =
  | "dashboard"
  | "organizations"
  | "schools"
  | "students"
  | "staff"
  | "expenses"
  | "stocks"
  | "report"
  | "users"
  | "roles"
  | "subscription"
  | "assistant"
  | "leaves";

export const PAGE_PATHS: Record<PageId, string> = {
  dashboard: "/",
  organizations: "/organizations",
  schools: "/schools",
  students: "/students",
  staff: "/staff",
  expenses: "/expenses",
  stocks: "/stocks",
  report: "/report",
  users: "/users",
  roles: "/roles",
  subscription: "/subscription",
  assistant: "/assistant",
  leaves: "/leaves",
};

const nav: { id: PageId; label: string; icon: React.ElementType; permission?: Permission }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
  { id: "assistant", label: "Axpo Assistant", icon: Bot, permission: "assistant:use" },
  { id: "organizations", label: "Organizations", icon: Building2, permission: "schools:create" },
  { id: "schools", label: "Schools & Sessions", icon: School, permission: "schools:view" },
  { id: "students", label: "Students & Fees", icon: Users, permission: "students:view" },
  { id: "staff", label: "Staff & Salary", icon: UserCog, permission: "staff:view" },
  { id: "expenses", label: "Expenses", icon: Receipt, permission: "expenses:view" },
  { id: "stocks", label: "Stock & Publishers", icon: Package, permission: "stocks:view" },
  { id: "leaves", label: "Leave Management", icon: CalendarOff, permission: "leaves:view" },
  { id: "report", label: "Year-End Report", icon: FileText, permission: "reports:view" },
  { id: "subscription", label: "Subscription & Plan", icon: CreditCard, permission: "schools:view" },
  { id: "users", label: "User Management", icon: UserPlus, permission: "users:view" },
  { id: "roles", label: "Roles & Permissions", icon: Shield, permission: "roles:manage" },
];

interface SidebarProps {
  onLoadSample: () => void;
  onClearData: () => void;
  onBackup: () => void;
  onRestore: () => void;
  onNavClick?: () => void;
}

export function Sidebar({
  onLoadSample,
  onClearData,
  onBackup,
  onRestore,
  onNavClick,
}: SidebarProps) {
  const { user, signOut, hasPermission } = useAuth();
  const { schools, sessions, selectedSchoolId, selectedSessionId, setSelectedSchool, setSelectedSession } = useApp();
  const isSuperAdmin = user?.role?.name === SUPER_ADMIN_ROLE_NAME;
  const selectedSchool = selectedSchoolId ? schools.find((s) => s.id === selectedSchoolId) : null;
  const hasAssistantPlan = selectedSchool ? planIncludesAssistant(selectedSchool.planId ?? "starter") : false;
  const canAccessAssistant = hasPermission("assistant:use") || isSuperAdmin;

  const sessionList = useMemo(
    () => sessions.filter((s) => s.schoolId === selectedSchoolId),
    [sessions, selectedSchoolId]
  );

  const navRef = useRef<HTMLElement>(null);
  const [showBottomGradient, setShowBottomGradient] = useState(false);

  const checkScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const hasMoreBelow = scrollHeight - clientHeight > 8;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 8;
    setShowBottomGradient(hasMoreBelow && !isAtBottom);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = navRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-slate-200 bg-slate-50">
      <div className="shrink-0 border-b border-slate-200 p-4">
        <h1 className="text-lg font-bold text-indigo-700">
          Axpo Finance
        </h1>
        <p className="text-xs text-slate-500">Manage income & expenses</p>
      </div>

      {/* School & Session selection */}
      <div className="shrink-0 border-b border-slate-200 p-3 space-y-2 bg-white/50">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
            <Building2 className="h-3.5 w-3.5" />
            School
          </label>
          <select
            value={selectedSchoolId ?? ""}
            onChange={(e) => setSelectedSchool(e.target.value || null)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="">Select school</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
            <Calendar className="h-3.5 w-3.5" />
            Session
          </label>
          <select
            value={selectedSessionId ?? ""}
            onChange={(e) => setSelectedSession(e.target.value || null)}
            disabled={!selectedSchoolId}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">Select session</option>
            {sessionList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="shrink-0 border-b border-slate-200 px-4 py-3 bg-slate-100/50">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role?.name || 'User'}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              title="Sign out"
              className="shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1 min-w-0">
        <nav
          ref={navRef}
          className="h-full space-y-0.5 overflow-y-auto p-2"
        >
          {nav.map(({ id, label, icon: Icon, permission }) => {
            if (id === "organizations" && !isSuperAdmin) return null;
            if (id === "assistant" && !canAccessAssistant) return null;
            const isAssistant = id === "assistant";
            const link = (
              <NavLink
                key={id}
                to={PAGE_PATHS[id]}
                end={id === "dashboard"}
                onClick={onNavClick}
                className={({ isActive }) =>
                  cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors min-h-[44px]",
                    isActive ? "bg-indigo-100 text-indigo-800" : "text-slate-700 hover:bg-slate-100"
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {isAssistant && (
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      hasAssistantPlan ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {hasAssistantPlan ? "Pro" : "Premium"}
                  </span>
                )}
              </NavLink>
            );

            if (permission && id !== "assistant") {
              return (
                <PermissionGate key={id} permission={permission}>
                  {link}
                </PermissionGate>
              );
            }

            return <Fragment key={id}>{link}</Fragment>;
          })}
        </nav>
        {/* Bottom gradient when more items below */}
        {showBottomGradient && (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent"
            aria-hidden
          />
        )}
      </div>
      <div className="shrink-0 border-t border-slate-200 p-2 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-indigo-700 hover:bg-indigo-50 min-h-[44px] touch-manipulation md:min-h-0"
          onClick={onBackup}
        >
          <Download className="h-4 w-4 shrink-0" />
          Backup data
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-indigo-700 hover:bg-indigo-50 min-h-[44px] touch-manipulation md:min-h-0"
          onClick={onRestore}
        >
          <Upload className="h-4 w-4 shrink-0" />
          Restore data
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-amber-700 hover:bg-amber-50 min-h-[44px] touch-manipulation md:min-h-0"
          onClick={onLoadSample}
        >
          <Loader2 className="h-4 w-4 shrink-0" />
          Load sample data
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 min-h-[44px] touch-manipulation md:min-h-0"
          onClick={onClearData}
        >
          <Trash2 className="h-4 w-4 shrink-0" />
          Clear all data
        </Button>
      </div>
    </aside>
  );
}
