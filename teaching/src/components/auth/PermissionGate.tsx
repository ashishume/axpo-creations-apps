import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Permission } from '../../types/auth';

interface PermissionGateProps {
  children: ReactNode;
  /** Required permission to show children */
  permission?: Permission;
  /** Required permissions (all must be present) */
  permissions?: Permission[];
  /** Alternative: any of these permissions grants access */
  anyPermission?: Permission[];
  /** Fallback component when access is denied (default: null) */
  fallback?: ReactNode;
}

/**
 * Conditionally render children based on user permissions.
 * Use this to hide/show UI elements based on permissions.
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  anyPermission,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

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

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check permissions imperatively
 */
export function usePermissions() {
  const { hasPermission, hasAllPermissions, hasAnyPermission, permissions } = useAuth();
  
  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    permissions,
    can: hasPermission, // Alias for cleaner code
    canAll: hasAllPermissions,
    canAny: hasAnyPermission,
  };
}
