import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Declarative component-level authorization gate.
 * Renders `children` only if the authenticated user has the necessary permissions.
 * Otherwise, renders `fallback` (defaults to null).
 *
 * Example:
 * <PermissionGate permission="orders_manage">
 *   <Button title="Accept Order" onPress={handleAccept} />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  role: requiredRole,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, role, isAdmin } = usePermissions();

  // Admins always bypass checks
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check specific role requirement if specified
  if (requiredRole && role !== requiredRole) {
    return <>{fallback}</>;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const isAuthorized = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!isAuthorized) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
