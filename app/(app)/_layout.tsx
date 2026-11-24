import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useSidebarStore } from '../../src/store/sidebarStore';
import { SidebarDrawer } from '../../src/components/navigation/SidebarDrawer';
import { Colors } from '../../src/constants/theme';
import {
  LayoutGrid,
  ChefHat,
  Bell,
  Receipt,
  Users,
  BarChart3,
  User,
  Menu,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { hasPermission, roleName, role, isAdmin, isKitchen, isWaiter, isCashier } = usePermissions();
  const { openSidebar } = useSidebarStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  /**
   * Tailor bottom bar to show ONLY 3 or 4 primary operational icons
   * based on the specific station role. All other features are in the Sidebar!
   */
  // 1. Dashboard: only for Admins & Managers on bottom bar
  const showBottomDashboard = (isAdmin || role === 'manager') && hasPermission('biz_growth');

  // 2. Floor tables: for Admins, Managers, Waiters, and Cashiers
  const showBottomTables = hasPermission('tables_view') && !isKitchen;

  // 3. Orders / KDS: for Kitchen, Waiters, Admins, and Managers
  const showBottomOrders = hasPermission('orders_view');

  // 4. Calls: on bottom bar specifically for Waiters
  const showBottomCalls = isWaiter && hasPermission('waiter_handler');

  // 5. Billing: for Cashiers, and on bottom bar for Admins
  const showBottomBilling = (isCashier || isAdmin) && hasPermission('billing_settle');

  // 6. Staff RBAC: kept in the Sidebar to keep bottom bar uncluttered at 3-4 icons
  const showBottomStaff = false;

  // 7. Profile/Station: shown on bottom bar for Kitchen, Waiter, and Cashier (Admins already have 4 tabs: Dashboard, Floor, Orders, Billing)
  const showBottomProfile = isKitchen || isWaiter || isCashier;

  return (
    <>
      <SidebarDrawer />

      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.card,
            elevation: 2,
            shadowOpacity: 0.05,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          },
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '800',
            color: Colors.text,
          },
          // Hamburger Icon on Top Left
          headerLeft: () => (
            <TouchableOpacity
              style={styles.hamburgerBtn}
              onPress={openSidebar}
              activeOpacity={0.7}
            >
              <Menu size={22} color={Colors.text} strokeWidth={2.2} />
            </TouchableOpacity>
          ),
          // Role Badge on Top Right
          headerRight: () => (
            <View style={styles.roleHeaderBadge}>
              <Text style={styles.roleHeaderText}>{roleName || role?.toUpperCase()}</Text>
            </View>
          ),
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: {
            backgroundColor: Colors.card,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
        }}
      >
        {/* 1. Dashboard (Admin / Manager) */}
        <Tabs.Screen
          name="dashboard/index"
          options={{
            title: 'Insights',
            headerTitle: 'Sales Insights',
            href: showBottomDashboard ? '/dashboard' : null,
            tabBarIcon: ({ color, size }) => <BarChart3 size={20} color={color} />,
          }}
        />

        {/* 2. Floor Tables (Waiters, Managers, Admins, Cashiers) */}
        <Tabs.Screen
          name="tables/index"
          options={{
            title: 'Floor',
            headerTitle: 'Floor Tables Map',
            href: showBottomTables ? '/tables' : null,
            tabBarIcon: ({ color, size }) => <LayoutGrid size={20} color={color} />,
          }}
        />

        {/* 3. Live Orders & KDS (Kitchen, Waiter, Admin) */}
        <Tabs.Screen
          name="orders/index"
          options={{
            title: 'Orders',
            headerTitle: isKitchen ? 'Kitchen Display System (KDS)' : 'Live Kitchen Orders',
            href: showBottomOrders ? '/orders' : null,
            tabBarIcon: ({ color, size }) => <ChefHat size={20} color={color} />,
          }}
        />

        {/* 4. Service Calls (Waiters) */}
        <Tabs.Screen
          name="calls/index"
          options={{
            title: 'Service',
            headerTitle: 'Guest Service Calls',
            href: showBottomCalls ? '/calls' : null,
            tabBarIcon: ({ color, size }) => <Bell size={20} color={color} />,
          }}
        />

        {/* 5. Billing POS (Cashiers & Admins) */}
        <Tabs.Screen
          name="billing/index"
          options={{
            title: 'Billing',
            headerTitle: 'POS Settlement Counter',
            href: showBottomBilling ? '/billing' : null,
            tabBarIcon: ({ color, size }) => <Receipt size={20} color={color} />,
          }}
        />

        {/* 6. Staff & RBAC (Always accessible in Sidebar, hidden from bottom bar) */}
        <Tabs.Screen
          name="staff/index"
          options={{
            title: 'Staff RBAC',
            headerTitle: 'Staff Roles & Permissions',
            href: showBottomStaff ? '/staff' : null,
            tabBarIcon: ({ color, size }) => <Users size={20} color={color} />,
          }}
        />

        {/* Staff Detail Route (Hidden from bottom bar) */}
        <Tabs.Screen
          name="staff/[id]"
          options={{
            href: null,
            headerShown: false,
          }}
        />

        {/* 7. Profile / Station (Available on bottom bar for staff without 4 operational tabs) */}
        <Tabs.Screen
          name="profile/index"
          options={{
            title: 'Station',
            headerTitle: 'My Station Profile',
            href: showBottomProfile ? '/profile' : null,
            tabBarIcon: ({ color, size }) => <User size={20} color={color} />,
          }}
        />

        {/* Hidden Index redirector */}
        <Tabs.Screen
          name="index"
          options={{
            href: null,
            headerShown: false,
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleHeaderBadge: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 16,
  },
  roleHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
