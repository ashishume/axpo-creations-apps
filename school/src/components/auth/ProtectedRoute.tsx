import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginPage } from '../../pages/LoginPage';
import type { Permission } from '../../types/auth';
import { ShieldX, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Required permission to access this route */
  permission?: Permission;
  /** Required permissions (all must be present) */
  permissions?: Permission[];
  /** Alternative: any of these permissions grants access */
  anyPermission?: Permission[];
  /** Fallback component when access is denied */
  fallback?: ReactNode;
  /** Show loading while checking auth */
  loadingFallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  permission,
  permissions,
  anyPermission,
  fallback,
  loadingFallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasAllPermissions, hasAnyPermission, user } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      loadingFallback || (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // User must change password - LoginPage handles this
  if (user?.mustChangePassword) {
    return <LoginPage />;
  }

  // Check permissions
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  }

  if (permissions && permissions.length > 0) {
    hasAccess = hasAccess && hasAllPermissions(permissions);
  }

  if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission(anyPermission);
  }

  // Access denied
  if (!hasAccess) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <ShieldX className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
              <p className="mt-2 text-sm text-slate-600">
                You don't have permission to access this page.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Contact your administrator if you believe this is an error.
              </p>
            </div>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
