import { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../lib/utils";
import { Building2, Calendar } from "lucide-react";

export function AppHeader() {
  const {
    schools,
    sessions,
    selectedSchoolId,
    selectedSessionId,
    setSelectedSchool,
    setSelectedSession,
  } = useApp();

  const sessionList = useMemo(
    () => sessions.filter((s) => s.schoolId === selectedSchoolId),
    [sessions, selectedSchoolId]
  );

  return (
    <header className="w-full border-b border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:px-6 md:py-2">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5 md:gap-x-6">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Building2 className="h-3.5 w-3.5" />
            School
          </span>
          <div className="flex flex-wrap gap-1">
            {schools.length === 0 ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                No schools yet
              </span>
            ) : (
              schools.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSchool(s.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors touch-manipulation min-h-[32px] md:min-h-0",
                    selectedSchoolId === s.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {s.name}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            Session
          </span>
          <div className="flex flex-wrap gap-1">
            {!selectedSchoolId ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                Select a school
              </span>
            ) : sessionList.length === 0 ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                No sessions
              </span>
            ) : (
              sessionList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSession(s.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors touch-manipulation min-h-[32px] md:min-h-0",
                    selectedSessionId === s.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {s.year}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
