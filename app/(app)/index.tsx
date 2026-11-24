import React from 'react';
import { Redirect } from 'expo-router';
import { usePermissions } from '../../src/hooks/usePermissions';

export default function IndexRedirector() {
  const { role, hasPermission, isAdmin } = usePermissions();

  if (isAdmin) {
    return <Redirect href="/dashboard" />;
  }

  if (role === 'kitchen') {
    return <Redirect href="/orders" />;
  }

  if (role === 'waiter') {
    return <Redirect href="/tables" />;
  }

  if (role === 'cashier') {
    return <Redirect href="/billing" />;
  }

  // Fallback to whichever permission is available
  if (hasPermission('orders_view')) {
    return <Redirect href="/orders" />;
  }
  if (hasPermission('tables_view')) {
    return <Redirect href="/tables" />;
  }
  if (hasPermission('waiter_handler')) {
    return <Redirect href="/calls" />;
  }
  if (hasPermission('billing_settle')) {
    return <Redirect href="/billing" />;
  }

  return <Redirect href="/profile" />;
}
