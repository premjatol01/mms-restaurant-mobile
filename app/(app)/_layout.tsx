import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { usePermissions } from '../../src/hooks/usePermissions';
import { Colors } from '../../src/constants/theme';
import {
  LayoutGrid,
  ChefHat,
  Bell,
  Receipt,
  Users,
  BarChart3,
  User,
} from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { hasPermission, roleName, role } = usePermissions();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Determine which tabs are authorized
  const canViewDashboard = role === 'admin' || role === 'restaurant_admin' || hasPermission('biz_growth');
  const canViewTables = hasPermission('tables_view');
  const canViewOrders = hasPermission('orders_view');
  const canViewCalls = hasPermission('waiter_handler');
  const canViewBilling = hasPermission('billing_settle');
  const canViewStaff = hasPermission('staff_manage');

  return (
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
          fontSize: 17,
          fontWeight: '700',
          color: Colors.text,
        },
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
          fontWeight: '600',
        },
      }}
    >
      {/* 1. Dashboard Tab (Admin/Manager) */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Insights',
          headerTitle: 'Sales & Metrics',
          href: canViewDashboard ? '/dashboard' : null,
          tabBarIcon: ({ color, size }) => <BarChart3 size={20} color={color} />,
        }}
      />

      {/* 2. Tables Floor Map (Waiters, Managers, Admins) */}
      <Tabs.Screen
        name="tables/index"
        options={{
          title: 'Floor',
          headerTitle: 'Floor Tables & Orders',
          href: canViewTables ? '/tables' : null,
          tabBarIcon: ({ color, size }) => <LayoutGrid size={20} color={color} />,
        }}
      />

      {/* 3. Live Orders & KDS (Kitchen, Waiter, Cashier, Admin) */}
      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'KDS / Orders',
          headerTitle: 'Live Kitchen Orders',
          href: canViewOrders ? '/orders' : null,
          tabBarIcon: ({ color, size }) => <ChefHat size={20} color={color} />,
        }}
      />

      {/* 4. Waiter Calls (Waiters, Floor Managers) */}
      <Tabs.Screen
        name="calls/index"
        options={{
          title: 'Service',
          headerTitle: 'Guest Service Requests',
          href: canViewCalls ? '/calls' : null,
          tabBarIcon: ({ color, size }) => <Bell size={20} color={color} />,
        }}
      />

      {/* 5. Billing POS (Cashiers, Managers, Admins) */}
      <Tabs.Screen
        name="billing/index"
        options={{
          title: 'Billing',
          headerTitle: 'POS Settlement Counter',
          href: canViewBilling ? '/billing' : null,
          tabBarIcon: ({ color, size }) => <Receipt size={20} color={color} />,
        }}
      />

      {/* 6. Staff & RBAC Management (Admin Only) */}
      <Tabs.Screen
        name="staff/index"
        options={{
          title: 'Staff RBAC',
          headerTitle: 'Staff Roles & Access',
          href: canViewStaff ? '/staff' : null,
          tabBarIcon: ({ color, size }) => <Users size={20} color={color} />,
        }}
      />

      {/* 7. Profile & Switcher (Always accessible) */}
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Station',
          headerTitle: 'My Staff Station',
          href: '/profile',
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
  );
}

const styles = StyleSheet.create({
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
