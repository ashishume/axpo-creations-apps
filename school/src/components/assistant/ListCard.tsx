import { GraduationCap, Briefcase } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { cn } from "../../lib/utils";

export interface StaffListItem {
  id: string;
  name: string;
  employeeId?: string;
  role?: string;
  monthlySalary: number;
  subjectOrGrade?: string;
  phone?: string;
}

export interface StudentListItem {
  id: string;
  name: string;
  studentId?: string;
  className?: string;
  feeType?: string;
  totalPaid: number;
  remaining: number;
  guardianPhone?: string;
}

export interface ListData {
  type: "staff" | "students";
  items: StaffListItem[] | StudentListItem[];
  totalCount: number;
  title: string;
}

interface ListCardProps {
  data: ListData;
}

function isStaffList(items: StaffListItem[] | StudentListItem[]): items is StaffListItem[] {
  return items.length === 0 || "monthlySalary" in items[0];
}

export function ListCard({ data }: ListCardProps) {
  const isStaff = data.type === "staff";

  return (
    <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className={cn(
        "px-4 py-3 border-b border-slate-100 dark:border-slate-700",
        isStaff ? "bg-indigo-50 dark:bg-indigo-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg shadow-sm",
            isStaff ? "bg-indigo-100 dark:bg-indigo-900/50" : "bg-emerald-100 dark:bg-emerald-900/50"
          )}>
            {isStaff ? (
              <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{data.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data.totalCount} {isStaff ? "staff member" : "student"}{data.totalCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {data.items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No {isStaff ? "staff" : "students"} found.
          </div>
        ) : isStaff && isStaffList(data.items) ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Name</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Role</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-300">Salary</th>
              </tr>
            </thead>
            <tbody>
              {(data.items as StaffListItem[]).map((item) => (
                <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                      {item.employeeId && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.employeeId}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300">
                      {item.role || "—"}
                    </span>
                    {item.subjectOrGrade && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.subjectOrGrade}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.monthlySalary)}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">/month</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Name</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Class</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-300">Paid</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-300">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {(data.items as StudentListItem[]).map((item) => (
                <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                      {item.studentId && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.studentId}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300">
                      {item.className || "—"}
                    </span>
                    {item.feeType && item.feeType !== "Regular" && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.feeType}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(item.totalPaid)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={cn(
                      "font-medium",
                      item.remaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
                    )}>
                      {formatCurrency(item.remaining)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.items.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {isStaff ? (
              <>Total salary: <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatCurrency((data.items as StaffListItem[]).reduce((sum, s) => sum + s.monthlySalary, 0))}
              </span>/month</>
            ) : (
              <>
                Total paid: <span className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency((data.items as StudentListItem[]).reduce((sum, s) => sum + s.totalPaid, 0))}
                </span>
                {" · "}
                Remaining: <span className="font-medium text-amber-600 dark:text-amber-400">
                  {formatCurrency((data.items as StudentListItem[]).reduce((sum, s) => sum + s.remaining, 0))}
                </span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
