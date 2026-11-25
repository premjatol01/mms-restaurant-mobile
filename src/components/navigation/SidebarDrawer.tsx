import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSidebarStore } from '../../store/sidebarStore';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { Colors } from '../../constants/theme';
import { PRESET_ROLES } from '../../constants/roles';
import {
  Store,
  LayoutGrid,
  ChefHat,
  Bell,
  Receipt,
  Users,
  BarChart3,
  User,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function SidebarDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebarStore();
  const { user, logout, loginAsDemoRole } = useAuthStore();
  const { roleName, role, hasPermission, isAdmin } = usePermissions();

  const handleNavigate = (path: string) => {
    closeSidebar();
    router.push(path as any);
  };

  const handleLogout = () => {
    closeSidebar();
    Alert.alert('Sign Out', 'Are you sure you want to exit your station?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleSwitchRole = async (targetRoleId: string) => {
    closeSidebar();
    await loginAsDemoRole(targetRoleId);
    router.replace('/(app)');
  };

  const canViewDashboard = isAdmin || hasPermission('biz_growth');
  const canViewTables = hasPermission('tables_view');
  const canViewOrders = hasPermission('orders_view');
  const canViewMenu = isAdmin || hasPermission('menu_availability') || hasPermission('menu_view');
  const canViewReviews = isAdmin || hasPermission('reviews_manage');
  const canViewCalls = hasPermission('waiter_handler');
  const canViewBilling = hasPermission('billing_settle');
  const canViewStaff = hasPermission('staff_manage');

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Sales Insights',
      icon: BarChart3,
      path: '/dashboard',
      allowed: canViewDashboard,
    },
    {
      id: 'tables',
      label: 'Floor Tables Map',
      icon: LayoutGrid,
      path: '/tables',
      allowed: canViewTables,
    },
    {
      id: 'orders',
      label: 'Kitchen Orders (KDS)',
      icon: ChefHat,
      path: '/orders',
      allowed: canViewOrders,
    },
    {
      id: 'menu',
      label: 'Menu & 86 Stock',
      icon: LayoutGrid,
      path: '/menu',
      allowed: canViewMenu,
    },
    {
      id: 'reviews',
      label: 'Customer Reviews',
      icon: Star,
      path: '/reviews',
      allowed: canViewReviews,
    },
    {
      id: 'calls',
      label: 'Guest Service Calls',
      icon: Bell,
      path: '/calls',
      allowed: canViewCalls,
    },
    {
      id: 'billing',
      label: 'POS Settlement Counter',
      icon: Receipt,
      path: '/billing',
      allowed: canViewBilling,
    },
    {
      id: 'staff',
      label: 'Staff & Roles (RBAC)',
      icon: Users,
      path: '/staff',
      allowed: canViewStaff,
    },
    {
      id: 'profile',
      label: 'Restaurant Settings',
      icon: User,
      path: '/profile',
      allowed: true,
    },
  ];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={closeSidebar}
    >
      <View style={styles.overlay}>
        {/* Backdrop touch to close */}
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Slide-out Drawer Panel */}
        <View style={styles.drawerPanel}>
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.brandRow}>
              <View style={styles.brandIconBox}>
                <Store size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.brandTitle}>{user?.restaurantName || 'Tablly'}</Text>
                <Text style={styles.brandSubtitle}>{user?.roleName || 'Restaurant Admin'} • Live</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={closeSidebar}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Staff Card */}
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user?.name?.charAt(0) || 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Staff Member'}
              </Text>
              <View style={styles.userRolePill}>
                <ShieldCheck size={11} color={Colors.primaryDark} />
                <Text style={styles.userRoleText}>{roleName || role?.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            {/* All Options Section */}
            <Text style={styles.sectionHeader}>ALL STATION MODULES</Text>
            <View style={styles.menuList}>
              {menuItems
                .filter((item) => item.allowed)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.path);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.menuItem, isActive && styles.menuItemActive]}
                      onPress={() => handleNavigate(item.path)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.menuItemIconCircle,
                          isActive && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                        ]}
                      >
                        <Icon size={17} color={isActive ? '#FFFFFF' : Colors.textSecondary} />
                      </View>
                      <Text
                        style={[
                          styles.menuItemLabel,
                          isActive && { color: Colors.primaryDark, fontWeight: '700' },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <ChevronRight size={15} color={isActive ? Colors.primary : Colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
            </View>

            {/* Quick Demo Role Switcher */}
            <View style={styles.demoSection}>
              <View style={styles.demoHeader}>
                <Sparkles size={14} color={Colors.primary} />
                <Text style={styles.demoTitle}>SWITCH STATION (LIVE DEMO)</Text>
              </View>
              <View style={styles.demoRolesGrid}>
                {PRESET_ROLES.map((r) => {
                  const isCurrent = user?.role === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.demoRolePill,
                        isCurrent && { borderColor: r.color, backgroundColor: r.color + '15' },
                      ]}
                      onPress={() => handleSwitchRole(r.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.demoRoleDot, { backgroundColor: r.color }]} />
                      <Text
                        style={[
                          styles.demoRoleText,
                          isCurrent && { color: r.color, fontWeight: '700' },
                        ]}
                      >
                        {r.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <LogOut size={16} color={Colors.rose} />
              <Text style={styles.logoutBtnText}>Sign Out Station</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawerPanel: {
    width: Math.min(width * 0.82, 320),
    height: '100%',
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 10,
  },
  brandHeader: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  brandSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  closeBtn: {
    padding: 6,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  userRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  userRoleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuList: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 10,
  },
  menuItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  menuItemIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.cardMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  demoSection: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  demoRolesGrid: {
    gap: 6,
  },
  demoRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  demoRoleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  demoRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.roseLight,
    borderWidth: 1,
    borderColor: Colors.roseBorder,
    height: 42,
    borderRadius: 10,
    marginTop: 20,
  },
  logoutBtnText: {
    color: Colors.rose,
    fontSize: 13,
    fontWeight: '700',
  },
});
