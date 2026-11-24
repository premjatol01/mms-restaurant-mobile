import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../../src/constants/theme';
import { Users, Plus, Utensils, CheckCircle } from 'lucide-react-native';

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'billed';
  guests?: number;
  billTotal?: number;
  timeSeated?: string;
}

const INITIAL_TABLES: Table[] = [
  { id: 't1', number: 'T-01', capacity: 2, status: 'available' },
  { id: 't2', number: 'T-02', capacity: 4, status: 'occupied', guests: 3, billTotal: 1250, timeSeated: '35m' },
  { id: 't3', number: 'T-03', capacity: 4, status: 'available' },
  { id: 't4', number: 'T-04', capacity: 6, status: 'occupied', guests: 5, billTotal: 2480, timeSeated: '45m' },
  { id: 't5', number: 'T-05', capacity: 2, status: 'billed', guests: 2, billTotal: 840, timeSeated: '1h 10m' },
  { id: 't6', number: 'T-06', capacity: 4, status: 'available' },
  { id: 't7', number: 'T-07', capacity: 8, status: 'occupied', guests: 7, billTotal: 3920, timeSeated: '20m' },
  { id: 't8', number: 'T-08', capacity: 4, status: 'available' },
];

export default function TablesScreen() {
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);

  const handleTablePress = (table: Table) => {
    if (table.status === 'available') {
      Alert.alert(
        `Open Session: ${table.number}`,
        `Seat guests at ${table.number} (Capacity: ${table.capacity} pax)?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Seat Guests',
            onPress: () => {
              setTables((prev) =>
                prev.map((t) =>
                  t.id === table.id
                    ? { ...t, status: 'occupied', guests: 2, billTotal: 0, timeSeated: 'Just now' }
                    : t
                )
              );
            },
          },
        ]
      );
    } else {
      Alert.alert(
        `${table.number} Session`,
        `Guests: ${table.guests} pax\nCurrent Bill: ₹${table.billTotal}\nTime Seated: ${table.timeSeated}`,
        [{ text: 'Close' }]
      );
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return { bg: Colors.emeraldLight, border: Colors.emeraldBorder, text: Colors.emerald, label: 'Available' };
      case 'occupied':
        return { bg: Colors.roseLight, border: Colors.roseBorder, text: Colors.rose, label: 'Dining' };
      case 'billed':
        return { bg: Colors.amberLight, border: Colors.amberBorder, text: Colors.amber, label: 'Bill Out' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Floor Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <View style={[styles.statusDot, { backgroundColor: Colors.emerald }]} />
          <Text style={styles.summaryText}>4 Free</Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.statusDot, { backgroundColor: Colors.rose }]} />
          <Text style={styles.summaryText}>3 Dining</Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={[styles.statusDot, { backgroundColor: Colors.amber }]} />
          <Text style={styles.summaryText}>1 Billed</Text>
        </View>
      </View>

      {/* Grid of Tables */}
      <FlatList
        data={tables}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => {
          const statusStyle = getStatusColor(item.status);
          return (
            <TouchableOpacity
              style={[
                styles.tableCard,
                { borderColor: statusStyle.border, backgroundColor: Colors.card },
              ]}
              onPress={() => handleTablePress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.tableHeader}>
                <Text style={styles.tableNumber}>{item.number}</Text>
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
                <Users size={14} color={Colors.textSecondary} />
                <Text style={styles.capacityText}>Max {item.capacity} guests</Text>
              </View>

              <View style={styles.cardDivider} />

              {item.status !== 'available' ? (
                <View style={styles.activeSessionInfo}>
                  <Text style={styles.billTotal}>₹{item.billTotal}</Text>
                  <Text style={styles.timeSeatedText}>{item.timeSeated}</Text>
                </View>
              ) : (
                <View style={styles.freeTablePrompt}>
                  <Plus size={14} color={Colors.emerald} />
                  <Text style={styles.freeTableText}>Tap to Seat</Text>
                </View>
              )}
            </TouchableOpacity>
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
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    fontWeight: '600',
    color: Colors.text,
  },
  gridContent: {
    padding: 14,
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
    minHeight: 130,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
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
    marginTop: 4,
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
  activeSessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  timeSeatedText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  freeTablePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  freeTableText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.emerald,
  },
});
