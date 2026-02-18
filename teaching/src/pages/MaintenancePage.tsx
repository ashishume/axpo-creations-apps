/**
 * Shown when VITE_MAINTENANCE_MODE=true (e.g. during upgrades).
 * Set in .env or .env.production and rebuild to enable.
 */
export function MaintenancePage() {
  const message =
    import.meta.env.VITE_MAINTENANCE_MESSAGE ||
    "We're upgrading a few features. We'll be back shortly.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-8 w-8 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Under maintenance</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <p className="mt-4 text-xs text-slate-500">
          Please try again in a few minutes.
        </p>
      </div>
    </div>
  );
}
