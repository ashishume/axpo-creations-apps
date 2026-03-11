import type { ReactNode } from "react";

interface FormFieldProps {
  /** Label text for the field */
  label: string;
  /** Whether the field is required (adds * to label) */
  required?: boolean;
  /** Form control element (input, select, textarea, etc.) */
  children: ReactNode;
  /** Error message to display below the field */
  error?: string;
  /** Helper text to display below the field */
  helper?: string;
  /** Additional class name for the container */
  className?: string;
}

/**
 * Reusable form field wrapper with consistent label styling
 */
export function FormField({
  label,
  required,
  children,
  error,
  helper,
  className = "",
}: FormFieldProps) {
  return (
    <div className={className}>
      <label
        className="block mb-1 text-sm font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {label}
        {required && " *"}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {helper}
        </p>
      )}
    </div>
  );
}
