import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../../src/constants/theme';
import { Clock, CheckCircle2, Flame, Utensils, AlertCircle } from 'lucide-react-native';

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface OrderTicket {
  id: string;
  ticketNo: string;
  tableNo: string;
  timeElapsed: string;
  status: 'pending' | 'cooking' | 'ready' | 'served';
  type: 'Dine-In' | 'Takeaway';
  items: OrderItem[];
  totalAmount: number;
}

const INITIAL_ORDERS: OrderTicket[] = [
  {
    id: 'ord_1',
    ticketNo: '#KOT-104',
    tableNo: 'Table 4',
    timeElapsed: '4m ago',
    status: 'pending',
    type: 'Dine-In',
    items: [
      { name: 'Paneer Butter Masala', quantity: 2, notes: 'Less spicy' },
      { name: 'Butter Naan', quantity: 4 },
      { name: 'Sweet Lassi', quantity: 2 },
    ],
    totalAmount: 940,
  },
  {
    id: 'ord_2',
    ticketNo: '#KOT-103',
    tableNo: 'Table 9',
    timeElapsed: '12m ago',
    status: 'cooking',
    type: 'Dine-In',
    items: [
      { name: 'Tandoori Chicken Full', quantity: 1 },
      { name: 'Garlic Roti', quantity: 3 },
    ],
    totalAmount: 680,
  },
  {
    id: 'ord_3',
    ticketNo: '#KOT-102',
    tableNo: 'Table 2',
    timeElapsed: '18m ago',
    status: 'ready',
    type: 'Dine-In',
    items: [
      { name: 'Dal Makhani', quantity: 1 },
      { name: 'Jeera Rice', quantity: 2 },
    ],
    totalAmount: 460,
  },
];

export default function OrdersScreen() {
  const [orders, setOrders] = useState<OrderTicket[]>(INITIAL_ORDERS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'cooking' | 'ready'>('all');

  const filteredOrders = orders.filter((ord) => {
    if (activeFilter === 'all') return true;
    return ord.status === activeFilter;
  });

  const advanceOrderStatus = (ticketId: string) => {
    setOrders((prev) =>
      prev
        .map((ord): OrderTicket => {
          if (ord.id !== ticketId) return ord;
          if (ord.status === 'pending') return { ...ord, status: 'cooking' };
          if (ord.status === 'cooking') return { ...ord, status: 'ready' };
          if (ord.status === 'ready') return { ...ord, status: 'served' };
          return ord;
        })
        .filter((ord) => ord.status !== 'served')
    );
  };

  const getStatusBadge = (status: OrderTicket['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'New Order', bg: Colors.amberLight, color: Colors.amber, border: Colors.amberBorder };
      case 'cooking':
        return { label: 'Cooking', bg: Colors.roseLight, color: Colors.rose, border: Colors.roseBorder };
      case 'ready':
        return { label: 'Ready to Serve', bg: Colors.emeraldLight, color: Colors.emerald, border: Colors.emeraldBorder };
      default:
        return { label: status, bg: Colors.cardMuted, color: Colors.textSecondary, border: Colors.border };
    }
  };

  const getNextActionText = (status: OrderTicket['status']) => {
    switch (status) {
      case 'pending':
        return 'Start Cooking 🔥';
      case 'cooking':
        return 'Mark Ready 🍽️';
      case 'ready':
        return 'Dispatch / Served ✨';
      default:
        return 'Done';
    }
  };

  return (
    <View style={styles.container}>
      {/* Status Filter Pill Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'cooking', 'ready'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterPill, activeFilter === filter && styles.filterPillActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === filter && styles.filterPillTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Utensils size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Active Orders</Text>
            <Text style={styles.emptySubtitle}>All table tickets have been dispatched.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);
          return (
            <View style={styles.ticketCard}>
              {/* Ticket Header */}
              <View style={styles.ticketHeader}>
                <View>
                  <Text style={styles.ticketNo}>{item.ticketNo}</Text>
                  <Text style={styles.tableNo}>{item.tableNo}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                  <View style={styles.timeRow}>
                    <Clock size={12} color={Colors.textSecondary} />
                    <Text style={styles.timeText}>{item.timeElapsed}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.ticketDivider} />

              {/* Items List */}
              <View style={styles.itemsList}>
                {item.items.map((dish, i) => (
                  <View key={i} style={styles.dishRow}>
                    <View style={styles.qtyBox}>
                      <Text style={styles.qtyText}>{dish.quantity}x</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dishName}>{dish.name}</Text>
                      {dish.notes && (
                        <Text style={styles.dishNotes}>Note: {dish.notes}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  item.status === 'ready' && { backgroundColor: Colors.emerald },
                  item.status === 'cooking' && { backgroundColor: Colors.rose },
                ]}
                onPress={() => advanceOrderStatus(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>
                  {getNextActionText(item.status)}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  ticketCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ticketNo: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  tableNo: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  itemsList: {
    gap: 8,
    marginBottom: 14,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.cardMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  dishNotes: {
    fontSize: 11,
    color: Colors.rose,
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
