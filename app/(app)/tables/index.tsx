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
  Alert,
} from 'react-native';
import { useFloorStore, FloorTable } from '../../../src/store/floorStore';
import { useMenuStockStore } from '../../../src/store/menuStockStore';
import { usePermissions } from '../../../src/hooks/usePermissions';
import { Colors } from '../../../src/constants/theme';
import {
  Users,
  Plus,
  Utensils,
  Receipt,
  X,
  Check,
  Search,
  Clock,
  Send,
  PlusCircle,
  MinusCircle,
  Sparkles,
} from 'lucide-react-native';

export default function TablesScreen() {
  const {
    tables,
    sectionFilter,
    setSectionFilter,
    seatGuests,
    addItemsToTable,
    requestBill,
    settleAndClearTable,
    loadTables,
  } = useFloorStore();

  const { items: menuDishes, loadStock } = useMenuStockStore();
  const { hasPermission, user } = usePermissions();

  const canManageSessions = hasPermission('table_sessions');
  const canSettleBills = hasPermission('billing_settle');

  // Selected table modal states
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [seatModalVisible, setSeatModalVisible] = useState(false);

  // Seat guests form
  const [guestCount, setGuestCount] = useState('2');

  // Table-side order builder cart: { [itemId]: { quantity, notes } }
  const [cart, setCart] = useState<{ [itemId: string]: { quantity: number; notes: string } }>({});
  const [dishSearch, setDishSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadTables();
    loadStock();
  }, []);

  const sections = ['all', 'Main Hall', 'Balcony', 'Outdoor'];

  const filteredTables = tables.filter((t) => {
    if (sectionFilter === 'all') return true;
    return t.section === sectionFilter;
  });

  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const billedCount = tables.filter((t) => t.status === 'billed').length;

  const handleTablePress = (table: FloorTable) => {
    setSelectedTable(table);
    if (table.status === 'available') {
      setSeatModalVisible(true);
    } else {
      setDetailModalVisible(true);
    }
  };

  const handleConfirmSeat = async () => {
    if (!selectedTable) return;
    const pax = parseInt(guestCount, 10) || selectedTable.capacity;
    await seatGuests(selectedTable.id, pax, user?.name || 'Waiter Station');
    setSeatModalVisible(false);
    // Open order modal right away for seamless table-side ordering
    setCart({});
    setOrderModalVisible(true);
  };

  const updateCartQty = (dishId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[dishId]?.quantity || 0;
      const nextQty = Math.max(0, current + delta);
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }
      return {
        ...prev,
        [dishId]: { quantity: nextQty, notes: prev[dishId]?.notes || '' },
      };
    });
  };

  const updateCartNotes = (dishId: string, notes: string) => {
    setCart((prev) => ({
      ...prev,
      [dishId]: { quantity: prev[dishId]?.quantity || 1, notes },
    }));
  };

  const handleDispatchOrder = async () => {
    if (!selectedTable) return;
    const cartEntries = Object.entries(cart);
    if (cartEntries.length === 0) {
      Alert.alert('Empty Order', 'Please select at least one dish portion.');
      return;
    }

    const newItems = cartEntries.map(([dishId, data]) => {
      const dish = menuDishes.find((d) => d.id === dishId)!;
      return {
        name: dish.name,
        price: dish.price,
        quantity: data.quantity,
        notes: data.notes,
        category: dish.category,
      };
    });

    await addItemsToTable(selectedTable.id, newItems);
    setOrderModalVisible(false);
    setDetailModalVisible(false);
    setCart({});
    Alert.alert(
      'KOT Dispatched 🔥',
      `Order sent to Kitchen KDS for ${selectedTable.number}. Ticket printed with ${newItems.length} items.`
    );
  };

  const handleRequestBill = async () => {
    if (!selectedTable) return;
    await requestBill(selectedTable.id);
    setDetailModalVisible(false);
    Alert.alert('Bill Requested', `${selectedTable.number} is marked as Billed. Sent to Cashier counter.`);
  };

  const getStatusColor = (status: FloorTable['status']) => {
    switch (status) {
      case 'available':
        return { bg: Colors.emeraldLight, border: Colors.emeraldBorder, text: Colors.emerald, label: 'Available' };
      case 'occupied':
        return { bg: Colors.roseLight, border: Colors.roseBorder, text: Colors.rose, label: 'Dining' };
      case 'billed':
        return { bg: Colors.amberLight, border: Colors.amberBorder, text: Colors.amber, label: 'Bill Out' };
    }
  };

  const categories = ['all', 'Main Course', 'Starters', 'Breads', 'Beverages', 'Desserts'];

  const filteredDishes = menuDishes.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(dishSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotalAmount = Object.entries(cart).reduce((sum, [dishId, data]) => {
    const dish = menuDishes.find((d) => d.id === dishId);
    return sum + (dish ? dish.price * data.quantity : 0);
  }, 0);

  return (
    <View style={styles.container}>
      {/* Floor Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <View style={[styles.statusDot, { backgroundColor: Colors.emerald }]} />
          <Text style={styles.summaryText}>{availableCount} Free</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.statusDot, { backgroundColor: Colors.rose }]} />
          <Text style={styles.summaryText}>{occupiedCount} Dining</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.statusDot, { backgroundColor: Colors.amber }]} />
          <Text style={styles.summaryText}>{billedCount} Billed</Text>
        </View>
      </View>

      {/* Section Filter Pills */}
      <View style={styles.sectionScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionScroll}>
          {sections.map((sec) => (
            <TouchableOpacity
              key={sec}
              style={[
                styles.sectionPill,
                sectionFilter === sec && styles.sectionPillActive,
              ]}
              onPress={() => setSectionFilter(sec)}
            >
              <Text
                style={[
                  styles.sectionPillText,
                  sectionFilter === sec && styles.sectionPillTextActive,
                ]}
              >
                {sec === 'all' ? 'All Sections' : sec}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid of Tables */}
      <FlatList
        data={filteredTables}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => {
          const statusStyle = getStatusColor(item.status);
          const elapsedMins = item.seatedAt ? Math.floor((Date.now() - item.seatedAt) / 60000) : 0;

          return (
            <TouchableOpacity
              style={[
                styles.tableCard,
                { borderColor: statusStyle.border, backgroundColor: Colors.card },
              ]}
              onPress={() => handleTablePress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.tableCardTop}>
                <View>
                  <Text style={styles.tableNumber}>{item.number}</Text>
                  <Text style={styles.tableSectionText}>{item.section}</Text>
                </View>
                <View
                  style={[
                    styles.tableBadge,
                    { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                  ]}
                >
                  <Text style={[styles.tableBadgeText, { color: statusStyle.text }]}>
                    {statusStyle.label}
                  </Text>
                </View>
              </View>

              <View style={styles.capacityRow}>
                <Users size={13} color={Colors.textSecondary} />
                <Text style={styles.capacityText}>
                  {item.status === 'available'
                    ? `Cap: ${item.capacity} pax`
                    : `${item.guests} seated • ${item.serverName}`}
                </Text>
              </View>

              <View style={styles.cardDivider} />

              {item.status !== 'available' ? (
                <View style={styles.sessionBottomRow}>
                  <View>
                    <Text style={styles.billTotal}>₹{item.subtotal}</Text>
                    <Text style={styles.itemCountText}>{item.items.length} dishes</Text>
                  </View>
                  <View style={styles.timeRow}>
                    <Clock size={11} color={Colors.textSecondary} />
                    <Text style={styles.timeElapsedText}>{elapsedMins}m</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.seatPromptRow}>
                  <Plus size={14} color={Colors.emerald} />
                  <Text style={styles.seatPromptText}>Tap to Seat Guests</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* 1. Seat Guests Modal */}
      <Modal
        visible={seatModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSeatModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Seat Guests at {selectedTable?.number}</Text>
            <Text style={styles.dialogSubtitle}>
              {selectedTable?.section} • Max Capacity: {selectedTable?.capacity} pax
            </Text>

            <Text style={styles.inputLabel}>Number of Guests (Pax)</Text>
            <TextInput
              style={styles.dialogInput}
              keyboardType="number-pad"
              value={guestCount}
              onChangeText={setGuestCount}
              placeholder="e.g. 2"
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setSeatModalVisible(false)}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogConfirmBtn}
                onPress={handleConfirmSeat}
              >
                <Text style={styles.dialogConfirmText}>Seat & Open Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Active Table Session Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>{selectedTable?.number} Active Session</Text>
              <Text style={styles.sheetSubtitle}>
                {selectedTable?.section} • {selectedTable?.guests} guests • Staff: {selectedTable?.serverName}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Bill Summary Box */}
            <View style={styles.billSummaryBox}>
              <Text style={styles.billBoxLabel}>Running Session Total</Text>
              <Text style={styles.billBoxAmount}>₹{selectedTable?.subtotal || 0}</Text>
              <Text style={styles.billBoxItems}>{selectedTable?.items.length || 0} items ordered</Text>
            </View>

            {/* Dishes Ordered List */}
            <Text style={styles.sectionHeading}>Items on Session</Text>
            {selectedTable?.items.map((item, idx) => (
              <View key={idx} style={styles.sessionItemRow}>
                <View style={styles.sessionItemQty}>
                  <Text style={styles.sessionItemQtyText}>{item.quantity}x</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionItemName}>{item.name}</Text>
                  {item.notes && <Text style={styles.sessionItemNotes}>Note: {item.notes}</Text>}
                </View>
                <Text style={styles.sessionItemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}

            <View style={{ height: 20 }} />

            {/* Action Buttons */}
            {canManageSessions && (
              <TouchableOpacity
                style={styles.addItemsButton}
                onPress={() => {
                  setCart({});
                  setOrderModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.addItemsButtonText}>Add More Items (Table-Side)</Text>
              </TouchableOpacity>
            )}

            {selectedTable?.status === 'occupied' && (
              <TouchableOpacity
                style={styles.requestBillButton}
                onPress={handleRequestBill}
                activeOpacity={0.8}
              >
                <Receipt size={18} color={Colors.amber} />
                <Text style={styles.requestBillButtonText}>Request Final Bill Slip</Text>
              </TouchableOpacity>
            )}

            {canSettleBills && selectedTable?.status === 'billed' && (
              <TouchableOpacity
                style={styles.settleButton}
                onPress={() => {
                  settleAndClearTable(selectedTable.id);
                  setDetailModalVisible(false);
                  Alert.alert('Table Cleared', `${selectedTable.number} is now Available.`);
                }}
                activeOpacity={0.8}
              >
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.settleButtonText}>Mark Settled & Free Table</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 3. Table-Side Menu Order Builder Modal */}
      <Modal
        visible={orderModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.orderBuilderContainer}>
          {/* Header */}
          <View style={styles.orderBuilderHeader}>
            <View>
              <Text style={styles.orderBuilderTitle}>Take Order • {selectedTable?.number}</Text>
              <Text style={styles.orderBuilderSubtitle}>
                Select dishes to dispatch directly to Kitchen KDS
              </Text>
            </View>
            <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.orderSearchBox}>
            <Search size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.orderSearchInput}
              placeholder="Search dishes (e.g. Paneer, Naan, Chicken)..."
              value={dishSearch}
              onChangeText={setDishSearch}
            />
          </View>

          {/* Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChips}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat === 'all' ? 'All Dishes' : cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Menu Items List */}
          <FlatList
            data={filteredDishes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.menuItemsList}
            renderItem={({ item }) => {
              const inCartQty = cart[item.id]?.quantity || 0;
              return (
                <View style={styles.menuItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dishTitle}>{item.name}</Text>
                    <Text style={styles.dishSubtitle}>
                      {item.category} • ₹{item.price}
                    </Text>

                    {inCartQty > 0 && (
                      <TextInput
                        style={styles.noteInput}
                        placeholder="Cooking instruction (e.g. less spicy)..."
                        placeholderTextColor={Colors.textMuted}
                        value={cart[item.id]?.notes || ''}
                        onChangeText={(text) => updateCartNotes(item.id, text)}
                      />
                    )}
                  </View>

                  <View style={styles.stepperContainer}>
                    {inCartQty > 0 ? (
                      <View style={styles.stepperRow}>
                        <TouchableOpacity onPress={() => updateCartQty(item.id, -1)}>
                          <MinusCircle size={26} color={Colors.rose} />
                        </TouchableOpacity>
                        <Text style={styles.stepperQtyText}>{inCartQty}</Text>
                        <TouchableOpacity onPress={() => updateCartQty(item.id, 1)}>
                          <PlusCircle size={26} color={Colors.emerald} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addButtonPill}
                        onPress={() => updateCartQty(item.id, 1)}
                      >
                        <Plus size={14} color={Colors.primary} />
                        <Text style={styles.addButtonPillText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />

          {/* Bottom Dispatch Bar */}
          {Object.keys(cart).length > 0 && (
            <View style={styles.cartFooterBar}>
              <View>
                <Text style={styles.cartItemsCount}>
                  {Object.values(cart).reduce((sum, c) => sum + c.quantity, 0)} items selected
                </Text>
                <Text style={styles.cartTotalText}>₹{cartTotalAmount}</Text>
              </View>

              <TouchableOpacity
                style={styles.dispatchKOTBtn}
                onPress={handleDispatchOrder}
                activeOpacity={0.8}
              >
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.dispatchKOTText}>Dispatch KOT 🔥</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
  },
  sectionScrollWrapper: {
    marginVertical: 10,
  },
  sectionScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sectionPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sectionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sectionPillTextActive: {
    color: '#FFFFFF',
  },
  gridContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  tableCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  tableCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tableNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  tableSectionText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tableBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  capacityText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  sessionBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  billTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  itemCountText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeElapsedText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  seatPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  seatPromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.emerald,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  dialogSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  dialogInput: {
    height: 44,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cardMuted,
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dialogConfirmBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  dialogConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sheetBody: {
    padding: 16,
  },
  billSummaryBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  billBoxLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  billBoxAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginVertical: 4,
  },
  billBoxItems: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  sessionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    gap: 10,
  },
  sessionItemQty: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionItemQtyText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  sessionItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  sessionItemNotes: {
    fontSize: 11,
    color: Colors.rose,
    marginTop: 2,
  },
  sessionItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  addItemsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    marginBottom: 10,
  },
  addItemsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  requestBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.amberLight,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    height: 48,
    borderRadius: 12,
    marginBottom: 10,
  },
  requestBillButtonText: {
    color: Colors.amber,
    fontSize: 14,
    fontWeight: '700',
  },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.emerald,
    height: 48,
    borderRadius: 12,
  },
  settleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  orderBuilderContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 50,
  },
  orderBuilderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  orderBuilderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  orderBuilderSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  orderSearchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  categoryChips: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  menuItemsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 10,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  dishTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  dishSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noteInput: {
    height: 32,
    backgroundColor: Colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    fontSize: 11,
    color: Colors.text,
    marginTop: 6,
  },
  stepperContainer: {
    alignItems: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperQtyText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    minWidth: 16,
    textAlign: 'center',
  },
  addButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  cartFooterBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  cartItemsCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cartTotalText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  dispatchKOTBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dispatchKOTText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
