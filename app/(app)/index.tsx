import React from 'react';
import { Redirect } from 'expo-router';
import { usePermissions } from '../../src/hooks/usePermissions';

export default function IndexRedirector() {
  const { role, hasPermission, isAdmin, isKitchen, isWaiter, isCashier, isStaff } = usePermissions();

  // Root Restaurant Admin routes directly to Insights Dashboard
  if (isAdmin) {
    return <Redirect href="/dashboard" />;
  }

  // Kitchen Chef / KDS station
  if (isKitchen) {
    return <Redirect href="/orders" />;
  }

  // Waiter / Captain station
  if (isWaiter) {
    return <Redirect href="/tables" />;
  }

  // Cashier / Billing station
  if (isCashier) {
    return <Redirect href="/billing" />;
  }

  // Sub-Admin / Staff members: route to operational stations according to granted permissions
  if (hasPermission('tables_view')) {
    return <Redirect href="/tables" />;
  }
  if (hasPermission('orders_view')) {
    return <Redirect href="/orders" />;
  }
  if (hasPermission('billing_settle')) {
    return <Redirect href="/billing" />;
  }
  if (hasPermission('waiter_handler')) {
    return <Redirect href="/calls" />;
  }
  if (hasPermission('menu_view') || hasPermission('menu_availability')) {
    return <Redirect href="/menu" />;
  }
  if (hasPermission('reviews_manage')) {
    return <Redirect href="/reviews" />;
  }
  if (hasPermission('biz_growth')) {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/profile" />;
}
