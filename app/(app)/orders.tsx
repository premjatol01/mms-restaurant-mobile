import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useOrdersStore, KOTTicket } from '../../src/store/ordersStore';
import { useMenuStockStore } from '../../src/store/menuStockStore';
import { usePermissions } from '../../src/hooks/usePermissions';
import { Colors } from '../../src/constants/theme';
import {
  Clock,
  Flame,
  ChefHat,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  PackageX,
  X,
  Search,
  SlidersHorizontal,
  Sun,
  Moon,
} from 'lucide-react-native';

export default function OrdersScreen() {
  const {
    orders,
    activeFilter,
    setActiveFilter,
    kitchenDisplayMode,
    toggleKitchenDisplayMode,
    advanceStatus,
    loadOrders,
  } = useOrdersStore();

  const { items: stockItems, toggleAvailability, searchQuery, setSearchQuery } = useMenuStockStore();
  const { hasPermission } = usePermissions();

  const canManageOrders = hasPermission('orders_manage');
  const canToggleStock = hasPermission('menu_availability');

  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  // Force re-render every 30s to keep elapsed time badges live
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const filteredOrders = orders.filter((ord) => {
    if (activeFilter === 'all') return true;
    return ord.status === activeFilter;
  });

  const getElapsedTimeInfo = (createdAt: number) => {
    const elapsedMinutes = Math.floor((Date.now() - createdAt) / 60000);
    if (elapsedMinutes < 1) return { text: 'Just now', isWarning: false, isCritical: false };
    if (elapsedMinutes < 10) return { text: `${elapsedMinutes}m ago`, isWarning: false, isCritical: false };
    if (elapsedMinutes < 20) return { text: `⚠️ ${elapsedMinutes}m ago`, isWarning: true, isCritical: false };
    return { text: `🔥 ${elapsedMinutes}m overdue`, isWarning: false, isCritical: true };
  };

  const getStatusBadge = (status: KOTTicket['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'New Ticket', bg: Colors.amberLight, color: Colors.amber, border: Colors.amberBorder };
      case 'cooking':
        return { label: 'In Kitchen 🔥', bg: Colors.roseLight, color: Colors.rose, border: Colors.roseBorder };
      case 'ready':
        return { label: 'Ready to Dispatch ✨', bg: Colors.emeraldLight, color: Colors.emerald, border: Colors.emeraldBorder };
      default:
        return { label: status, bg: Colors.cardMuted, color: Colors.textSecondary, border: Colors.border };
    }
  };

  const getActionButtonText = (status: KOTTicket['status']) => {
    switch (status) {
      case 'pending':
        return 'Accept & Start Cooking 🔥';
      case 'cooking':
        return 'Mark Ready for Pickup 🍽️';
      case 'ready':
        return 'Served to Guest ✨';
      default:
        return 'Complete';
    }
  };

  const isDark = kitchenDisplayMode;
  const currentBg = isDark ? Colors.darkBackground : Colors.background;
  const currentCard = isDark ? Colors.darkCard : Colors.card;
  const currentText = isDark ? Colors.darkText : Colors.text;
  const currentBorder = isDark ? Colors.darkBorder : Colors.border;

  const soldOutCount = stockItems.filter((i) => !i.isAvailable).length;

  return (
    <View style={[styles.container, { backgroundColor: currentBg }]}>
      {/* Top Operations Bar */}
      <View style={[styles.topBar, { backgroundColor: currentCard, borderColor: currentBorder }]}>
        <View style={styles.topBarLeft}>
          <Text style={[styles.screenTitle, { color: currentText }]}>Kitchen Orders</Text>
          <Text style={styles.screenSubtitle}>
            {orders.length} active tickets • {orders.filter((o) => o.status === 'cooking').length} cooking
          </Text>
        </View>

        <View style={styles.topBarActions}>
          {/* Out of Stock (86) Button */}
          {canToggleStock && (
            <TouchableOpacity
              style={[
                styles.stockButton,
                soldOutCount > 0 && { backgroundColor: Colors.roseLight, borderColor: Colors.roseBorder },
              ]}
              onPress={() => setStockModalVisible(true)}
              activeOpacity={0.8}
            >
              <PackageX size={15} color={soldOutCount > 0 ? Colors.rose : Colors.textSecondary} />
              <Text
                style={[
                  styles.stockButtonText,
                  soldOutCount > 0 && { color: Colors.rose, fontWeight: '700' },
                ]}
              >
                86 Items ({soldOutCount})
              </Text>
            </TouchableOpacity>
          )}

          {/* Theme Toggle (Kitchen Glare mode) */}
          <TouchableOpacity
            style={[styles.modeToggle, { borderColor: currentBorder }]}
            onPress={toggleKitchenDisplayMode}
            activeOpacity={0.8}
          >
            {isDark ? <Sun size={16} color="#FBBF24" /> : <Moon size={16} color={Colors.textSecondary} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: currentCard, borderColor: currentBorder }]}>
        {(['all', 'pending', 'cooking', 'ready'] as const).map((filter) => {
          const count =
            filter === 'all'
              ? orders.length
              : orders.filter((o) => o.status === filter).length;
          const isActive = activeFilter === filter;

          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                isActive && {
                  backgroundColor: isDark ? Colors.primaryDark : Colors.primary,
                  borderColor: Colors.primary,
                },
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && styles.filterTabTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* KDS Ticket Cards */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ChefHat size={48} color={Colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: currentText }]}>No Pending Tickets</Text>
            <Text style={styles.emptySubtitle}>All table orders have been dispatched and served.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);
          const timeInfo = getElapsedTimeInfo(item.createdAt);

          return (
            <View
              style={[
                styles.ticketCard,
                { backgroundColor: currentCard, borderColor: currentBorder },
                timeInfo.isCritical && { borderColor: Colors.rose, borderWidth: 2 },
                timeInfo.isWarning && { borderColor: Colors.amber, borderWidth: 1.5 },
              ]}
            >
              {/* Ticket Header */}
              <View style={styles.ticketHeader}>
                <View>
                  <View style={styles.kotTitleRow}>
                    <Text style={[styles.kotNumber, { color: currentText }]}>{item.kotNo}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.orderType}</Text>
                    </View>
                  </View>
                  <Text style={styles.tableNumber}>{item.tableNo}</Text>
                  <Text style={styles.serverText}>Staff: {item.serverName}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
                    <Text style={[styles.statusPillText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.timePill,
                      timeInfo.isCritical && { backgroundColor: Colors.roseLight },
                      timeInfo.isWarning && { backgroundColor: Colors.amberLight },
                    ]}
                  >
                    <Clock
                      size={12}
                      color={
                        timeInfo.isCritical
                          ? Colors.rose
                          : timeInfo.isWarning
                          ? Colors.amber
                          : Colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.timePillText,
                        timeInfo.isCritical && { color: Colors.rose, fontWeight: '700' },
                        timeInfo.isWarning && { color: Colors.amber, fontWeight: '700' },
                      ]}
                    >
                      {timeInfo.text}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.ticketDivider, { backgroundColor: isDark ? currentBorder : Colors.borderLight }]} />

              {/* Items Table */}
              <View style={styles.itemsWrapper}>
                {item.items.map((dish, i) => (
                  <View key={i} style={styles.itemRow}>
                    <View style={[styles.qtyBadge, { backgroundColor: isDark ? Colors.darkBorder : Colors.primaryLight }]}>
                      <Text style={[styles.qtyBadgeText, { color: isDark ? '#FFFFFF' : Colors.primaryDark }]}>
                        {dish.quantity}x
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dishName, { color: currentText }]}>{dish.name}</Text>
                      {dish.notes && (
                        <Text style={styles.dishNoteText}>⚡ Note: {dish.notes}</Text>
                      )}
                    </View>
                    <Text style={styles.categoryTag}>{dish.category}</Text>
                  </View>
                ))}
              </View>

              {/* Advance Status Button (Guarded by orders_manage) */}
              {canManageOrders ? (
                <TouchableOpacity
                  style={[
                    styles.advanceButton,
                    item.status === 'cooking' && { backgroundColor: Colors.emerald },
                    item.status === 'ready' && { backgroundColor: Colors.blue },
                  ]}
                  onPress={() => advanceStatus(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.advanceButtonText}>
                    {getActionButtonText(item.status)}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.viewOnlyBanner}>
                  <Text style={styles.viewOnlyText}>View Only • Waiter Station</Text>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* 86 Sold-Out Dishes Modal */}
      <Modal
        visible={stockModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setStockModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Item Stock & 86 Control</Text>
              <Text style={styles.modalSubtitle}>
                Turn off dishes that are temporarily sold out
              </Text>
            </View>
            <TouchableOpacity onPress={() => setStockModalVisible(false)}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.modalSearchWrapper}>
            <Search size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search dishes to toggle availability..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Dishes List */}
          <FlatList
            data={stockItems.filter((i) =>
              i.name.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.stockListContent}
            renderItem={({ item }) => (
              <View style={styles.stockItemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stockItemName}>{item.name}</Text>
                  <Text style={styles.stockItemMeta}>
                    {item.category} • ₹{item.price}
                  </Text>
                </View>

                <View style={styles.stockToggleContainer}>
                  <Text
                    style={[
                      styles.stockStatusText,
                      { color: item.isAvailable ? Colors.emerald : Colors.rose },
                    ]}
                  >
                    {item.isAvailable ? 'Available' : '86 Sold Out'}
                  </Text>
                  <Switch
                    value={item.isAvailable}
                    onValueChange={() => toggleAvailability(item.id)}
                    trackColor={{ false: Colors.roseBorder, true: Colors.emeraldBorder }}
                    thumbColor={item.isAvailable ? Colors.emerald : Colors.rose}
                  />
                </View>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stockButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modeToggle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulationBanner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    borderRadius: 10,
  },
  simButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  ticketCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
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
  kotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kotNumber: {
    fontSize: 17,
    fontWeight: '800',
  },
  typeBadge: {
    backgroundColor: Colors.blueLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.blue,
  },
  tableNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  serverText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cardMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  timePillText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  ticketDivider: {
    height: 1,
    marginVertical: 12,
  },
  itemsWrapper: {
    gap: 10,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dishName: {
    fontSize: 14,
    fontWeight: '700',
  },
  dishNoteText: {
    fontSize: 11,
    color: Colors.rose,
    fontStyle: 'italic',
    marginTop: 2,
  },
  categoryTag: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  advanceButton: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  advanceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  viewOnlyBanner: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: Colors.cardMuted,
    borderRadius: 8,
  },
  viewOnlyText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: 16,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  stockListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  stockItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stockItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  stockItemMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stockToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
