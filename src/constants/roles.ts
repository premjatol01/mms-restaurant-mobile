// Tablly Role-Based Access Control (RBAC) Constants
// Direct parity with restaurant-admin/src/pages/staff/data/staffData.js

export interface Permission {
  id: string;
  label: string;
  description: string;
}

export interface PermissionGroup {
  group: string;
  description: string;
  permissions: Permission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: 'Orders & Kitchen Operations',
    description: 'Manage incoming dine-in orders, KOT tickets, and preparation statuses',
    permissions: [
      { id: 'orders_view', label: 'View Live Orders & KOT', description: 'Monitor active order tickets and table statuses' },
      { id: 'orders_manage', label: 'Update Order Status', description: 'Accept, mark preparing, ready, served, or cancel orders' },
      { id: 'table_sessions', label: 'Manage Table Sessions', description: 'Open table sessions, add items, and close sessions' },
    ],
  },
  {
    group: 'Menu & Inventory',
    description: 'Control digital menu dishes, pricing, and 86 sold-out items',
    permissions: [
      { id: 'menu_view', label: 'View Menu Items', description: 'Browse all items, prices, and combos' },
      { id: 'menu_manage', label: 'Edit Menu & Pricing', description: 'Create dishes, update prices and food descriptions' },
      { id: 'menu_availability', label: 'Toggle Item Availability', description: 'Mark dishes as Available or 86 Sold-out instantly' },
    ],
  },
  {
    group: 'Floor Tables & QR Codes',
    description: 'Floor layout, table capacities, and QR standees',
    permissions: [
      { id: 'tables_view', label: 'View Tables & QR Codes', description: 'View physical floor tables and statuses' },
      { id: 'tables_manage', label: 'Manage Tables & Print QR', description: 'Add tables and manage floor sections' },
    ],
  },
  {
    group: 'Guest Service & Entertainment',
    description: 'Customer requests, waiter service calling, and dining experience',
    permissions: [
      { id: 'portal_handler', label: 'Portal Configuration', description: 'Configure table ordering & bestsellers' },
      { id: 'table_games', label: 'Table Games Control', description: 'Toggle Foodie Trivia, Dare & Spin Wheel' },
      { id: 'waiter_handler', label: 'Waiter Service Requests', description: 'Receive customer calls for water, captain, or bill' },
    ],
  },
  {
    group: 'Marketing, Reviews & Growth',
    description: 'Customer loyalty, promotional coupons, and reviews',
    permissions: [
      { id: 'offers_manage', label: 'Create Offers & Coupons', description: 'Create discount vouchers & promo banners' },
      { id: 'reviews_manage', label: 'Moderate Customer Reviews', description: 'Manage customer feedback' },
      { id: 'biz_growth', label: 'Access Biz Growth Hub', description: 'Access revenue playbooks and growth guides' },
    ],
  },
  {
    group: 'Billing, GST & Administration',
    description: 'Payment collection, bill receipts, and staff RBAC',
    permissions: [
      { id: 'billing_settle', label: 'Settle Bills & Collect Payment', description: 'Record cash, card, or UPI settlements' },
      { id: 'gst_reports', label: 'GST Reports & Export', description: 'Generate GST invoices and financial summaries' },
      { id: 'staff_manage', label: 'Manage Staff & Roles (RBAC)', description: 'Invite new team members and assign role permissions' },
    ],
  },
];

export const ALL_PERMISSION_IDS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.id));

export interface PresetRole {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
}

export const PRESET_ROLES: PresetRole[] = [
  {
    id: 'admin',
    name: 'Restaurant Admin',
    description: 'Full unrestricted access to all operations, menu, billing, staff, and platform settings.',
    color: '#D9480F',
    permissions: ALL_PERMISSION_IDS,
  },
  {
    id: 'manager',
    name: 'Floor Manager',
    description: 'Oversees day-to-day operations, kitchen orders, table sessions, menu availability, and reviews.',
    color: '#2563EB',
    permissions: [
      'orders_view', 'orders_manage', 'table_sessions',
      'menu_view', 'menu_manage', 'menu_availability',
      'tables_view', 'tables_manage',
      'portal_handler', 'table_games', 'waiter_handler',
      'offers_manage', 'reviews_manage', 'biz_growth',
      'billing_settle'
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen Chef / KDS',
    description: 'Kitchen Display System (KDS) view to accept, prepare, and dispatch orders, plus 86 sold-out items.',
    color: '#D97706',
    permissions: [
      'orders_view', 'orders_manage',
      'menu_view', 'menu_availability'
    ],
  },
  {
    id: 'waiter',
    name: 'Waiter / Captain',
    description: 'Floor service staff taking customer orders, answering calls (water, bill), and tracking tables.',
    color: '#059669',
    permissions: [
      'orders_view', 'table_sessions',
      'tables_view', 'waiter_handler', 'menu_view'
    ],
  },
  {
    id: 'cashier',
    name: 'Cashier / Billing',
    description: 'Billing counter operator settling unpaid orders (Cash/UPI/Card) and generating bill receipts.',
    color: '#7C3AED',
    permissions: [
      'orders_view', 'table_sessions',
      'billing_settle', 'gst_reports'
    ],
  },
];
