import { useAuthStore } from '../store/authStore';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  const isStaff = Boolean(user?.isStaff);
  const isOwner = user?.isOwner !== undefined ? Boolean(user.isOwner) : !isStaff;
  const roleId = user?.roleId || (isStaff ? 'manager' : 'admin');

  // Root restaurant admin is the owner or non-staff admin
  const isAdmin = !isStaff && (isOwner || roleId === 'admin');

  const roleNameLower = (user?.roleName || '').toLowerCase();
  const isManager = roleId === 'manager' || roleNameLower.includes('manager') || roleNameLower.includes('sub admin');
  const isKitchen = roleId === 'kitchen' || roleNameLower.includes('kitchen') || roleNameLower.includes('chef') || roleNameLower.includes('kds');
  const isWaiter = roleId === 'waiter' || roleNameLower.includes('waiter') || roleNameLower.includes('captain');
  const isCashier = roleId === 'cashier' || roleNameLower.includes('cashier') || roleNameLower.includes('billing');

  const hasPermission = (permissionId: string): boolean => {
    if (!user) return false;
    // Only root admins have wildcard access to every module
    if (isAdmin) return true;
    return user.permissions?.includes(permissionId) ?? false;
  };

  const hasAnyPermission = (permissionIds: string[]): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return permissionIds.some((id) => user.permissions?.includes(id));
  };

  const hasAllPermissions = (permissionIds: string[]): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return permissionIds.every((id) => user.permissions?.includes(id));
  };

  return {
    user,
    role: roleId || user?.role,
    roleId,
    roleName: user?.roleName || (isAdmin ? 'Restaurant Admin' : 'Staff Member'),
    permissions: user?.permissions || [],
    isOwner,
    isStaff,
    isAdmin,
    isManager,
    isKitchen,
    isWaiter,
    isCashier,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
