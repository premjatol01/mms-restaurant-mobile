import { useAuthStore } from '../store/authStore';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  const hasPermission = (permissionId: string): boolean => {
    if (!user) return false;
    // Admins have wildcard access to every module
    if (user.role === 'admin' || user.role === 'restaurant_admin') return true;
    return user.permissions?.includes(permissionId) ?? false;
  };

  const hasAnyPermission = (permissionIds: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'restaurant_admin') return true;
    return permissionIds.some((id) => user.permissions?.includes(id));
  };

  const hasAllPermissions = (permissionIds: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'restaurant_admin') return true;
    return permissionIds.every((id) => user.permissions?.includes(id));
  };

  return {
    user,
    role: user?.role,
    roleName: user?.roleName,
    permissions: user?.permissions || [],
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: user?.role === 'admin' || user?.role === 'restaurant_admin',
    isManager: user?.role === 'manager',
    isKitchen: user?.role === 'kitchen',
    isWaiter: user?.role === 'waiter',
    isCashier: user?.role === 'cashier',
  };
}
