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
  Star,
  Utensils,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { roleName, role, isAdmin, isKitchen, isWaiter, isCashier, hasPermission } = usePermissions();
  const { openSidebar } = useSidebarStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  /**
   * Bottom bar displays ONLY the 3 to 4 essential operational icons
   * according to role. All other modules are accessible via the Hamburger Drawer!
   */
  const showBottomDashboard = isAdmin; // Only Root Admin gets Sales Insights on bottom bar
  const showBottomTables = isAdmin || (hasPermission('tables_view') && !isKitchen);
  const showBottomOrders = isAdmin || hasPermission('orders_view');
  const showBottomBilling = isAdmin || (hasPermission('billing_settle') && !isWaiter && !isKitchen);
  const showBottomCalls = isWaiter || (hasPermission('waiter_handler') && !isAdmin && !hasPermission('billing_settle'));
  const showBottomProfile = !isAdmin; // Sub-admin / staff members have station profile on bottom bar

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
              <Text style={styles.roleHeaderText}>{roleName || (isAdmin ? 'Admin' : 'Staff')}</Text>
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
        {/* 1. Dashboard / Insights (Admin / Manager) */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Insights',
            headerTitle: 'Sales Insights',
            tabBarItemStyle: showBottomDashboard ? undefined : { display: 'none' },
            tabBarIcon: ({ color, size }) => <BarChart3 size={20} color={color} />,
          }}
        />

        {/* 2. Floor Tables Map (Waiters, Managers, Admins, Cashiers) */}
        <Tabs.Screen
          name="tables"
          options={{
            title: 'Floor',
            headerTitle: 'Floor Tables Map',
            tabBarItemStyle: showBottomTables ? undefined : { display: 'none' },
            tabBarIcon: ({ color, size }) => <LayoutGrid size={20} color={color} />,
          }}
        />

        {/* 3. Live Orders & KDS (Kitchen, Waiter, Admin) */}
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            headerTitle: isKitchen ? 'Kitchen Display System (KDS)' : 'Live Kitchen Orders',
            tabBarItemStyle: showBottomOrders ? undefined : { display: 'none' },
            tabBarIcon: ({ color, size }) => <ChefHat size={20} color={color} />,
          }}
        />

        {/* 4. Billing POS (Cashiers & Admins) */}
        <Tabs.Screen
          name="billing"
          options={{
            title: 'Billing',
            headerTitle: 'POS Settlement Counter',
            tabBarItemStyle: showBottomBilling ? undefined : { display: 'none' },
            tabBarIcon: ({ color, size }) => <Receipt size={20} color={color} />,
          }}
        />

        {/* 5. Menu & 86 Stock (Accessible from Sidebar) */}
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            headerTitle: 'Menu & 86 Item Availability',
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({ color, size }) => <Utensils size={20} color={color} />,
          }}
        />

        {/* 6. Customer Reviews (Accessible from Sidebar) */}
        <Tabs.Screen
          name="reviews"
          options={{
            title: 'Reviews',
            headerTitle: 'Customer Reviews & Ratings',
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({ color, size }) => <Star size={20} color={color} />,
          }}
        />

        {/* 7. Service Calls (Waiters bottom bar, hidden for admins) */}
        <Tabs.Screen
          name="calls"
          options={{
            title: 'Service',
            headerTitle: 'Guest Service Calls',
            tabBarItemStyle: showBottomCalls ? undefined : { display: 'none' },
            tabBarIcon: ({ color, size }) => <Bell size={20} color={color} />,
          }}
        />

        {/* 8. Staff & RBAC (Accessible from Sidebar) */}
        <Tabs.Screen
          name="staff"
          options={{
            title: 'Staff RBAC',
            headerTitle: 'Staff Roles & Permissions',
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({ color, size }) => <Users size={20} color={color} />,
          }}
        />

        {/* 9. Profile / Restaurant Settings (Accessible from Sidebar or bottom bar for staff) */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Settings',
            headerTitle: 'Restaurant Profile & Settings',
            tabBarItemStyle: showBottomProfile ? undefined : { display: 'none' },
            tabBarIcon: ({ color, size }) => <User size={20} color={color} />,
          }}
        />

        {/* Hidden Index redirector */}
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
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
