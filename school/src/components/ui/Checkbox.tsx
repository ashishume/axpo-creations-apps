import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const checkboxClasses =
  "h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 dark:focus:ring-offset-slate-900";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id: idProp, ...props }, ref) => {
    const id = idProp ?? `checkbox-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={cn(checkboxClasses, className)}
          {...props}
        />
        {label != null && (
          <label
            htmlFor={id}
            className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
