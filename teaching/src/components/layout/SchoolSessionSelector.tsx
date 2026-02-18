import { useApp } from "../../context/AppContext";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../../lib/utils";

export function SchoolSessionSelector() {
  const {
    schools,
    sessions,
    selectedSchoolId,
    selectedSessionId,
    setSelectedSchool,
    setSelectedSession,
  } = useApp();
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);

  const selectedSchool = useMemo(
    () => schools.find((s) => s.id === selectedSchoolId),
    [schools, selectedSchoolId]
  );
  const sessionList = useMemo(
    () => sessions.filter((s) => s.schoolId === selectedSchoolId),
    [sessions, selectedSchoolId]
  );
  const selectedSession = useMemo(
    () => sessionList.find((s) => s.id === selectedSessionId),
    [sessionList, selectedSessionId]

  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setSchoolOpen(!schoolOpen);
            setSessionOpen(false);
          }}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {selectedSchool ? selectedSchool.name : "Select school"}
          <ChevronDown className="h-4 w-4" />
        </button>
        {schoolOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setSchoolOpen(false)}
            />
            <ul
              className="absolute left-0 top-full z-20 mt-1 max-h-60 w-56 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              role="listbox"
            >
              {schools.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-500">
                  No schools. Add one in Schools & Sessions.
                </li>
              ) : (
                schools.map((s) => (
                  <li key={s.id} role="option">
                    <button
                      type="button"
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-slate-100",
                        selectedSchoolId === s.id && "bg-indigo-50 text-indigo-800"
                      )}
                      onClick={() => {
                        setSelectedSchool(s.id);
                        const sessionsForSchool = sessions.filter((sec) => sec.schoolId === s.id);
                        setSelectedSession(sessionsForSchool[0]?.id ?? null);
                        setSchoolOpen(false);
                      }}
                    >
                      {s.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setSessionOpen(!sessionOpen);
            setSchoolOpen(false);
          }}
          disabled={!selectedSchoolId}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {selectedSession ? selectedSession.year : "Select session"}
          <ChevronDown className="h-4 w-4" />
        </button>
        {sessionOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setSessionOpen(false)}
            />
            <ul
              className="absolute left-0 top-full z-20 mt-1 max-h-60 w-40 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              role="listbox"
            >
              {sessionList.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-500">
                  No sessions.
                </li>
              ) : (
                sessionList.map((s) => (
                  <li key={s.id} role="option">
                    <button
                      type="button"
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-slate-100",
                        selectedSessionId === s.id && "bg-indigo-50 text-indigo-800"
                      )}
                      onClick={() => {
                        setSelectedSession(s.id);
                        setSessionOpen(false);
                      }}
                    >
                      {s.year}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
