import { cn } from "../../lib/utils";

export interface ChipOption {
  value: string;
  label: string;
}

interface FilterChipsProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Stable key for options; empty string can cause React reconciliation issues. */
function chipKey(opt: ChipOption): string {
  return opt.value === "" ? "__all__" : opt.value;
}

export function FilterChips({ options, value, onChange, className }: FilterChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} role="group" aria-label="Filter">
      {options.map((opt) => (
        <button
          key={chipKey(opt)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-700 dark:hover:ring-slate-500"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
