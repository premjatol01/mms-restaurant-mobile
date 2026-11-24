import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors } from '../../../src/constants/theme';
import { Bell, Droplets, Receipt, UserCheck, Check } from 'lucide-react-native';

interface WaiterCall {
  id: string;
  tableNo: string;
  type: 'water' | 'bill' | 'steward';
  label: string;
  timeElapsed: string;
}

const INITIAL_CALLS: WaiterCall[] = [
  { id: 'c1', tableNo: 'Table 4', type: 'water', label: 'Drinking Water requested', timeElapsed: '2m ago' },
  { id: 'c2', tableNo: 'Table 7', type: 'bill', label: 'Requested final bill & settlement', timeElapsed: '5m ago' },
  { id: 'c3', tableNo: 'Table 2', type: 'steward', label: 'Captain assistance needed', timeElapsed: '8m ago' },
];

export default function CallsScreen() {
  const [calls, setCalls] = useState<WaiterCall[]>(INITIAL_CALLS);

  const dismissCall = (id: string) => {
    setCalls((prev) => prev.filter((c) => c.id !== id));
  };

  const getCallIcon = (type: WaiterCall['type']) => {
    switch (type) {
      case 'water':
        return <Droplets size={20} color={Colors.blue} />;
      case 'bill':
        return <Receipt size={20} color={Colors.emerald} />;
      case 'steward':
        return <UserCheck size={20} color={Colors.amber} />;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={calls}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Pending Service Calls</Text>
            <Text style={styles.emptySubtitle}>All guest table calls have been attended to.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.callCard}>
            <View style={styles.callIconBox}>{getCallIcon(item.type)}</View>

            <View style={{ flex: 1 }}>
              <View style={styles.callHeader}>
                <Text style={styles.tableText}>{item.tableNo}</Text>
                <Text style={styles.timeText}>{item.timeElapsed}</Text>
              </View>
              <Text style={styles.callDesc}>{item.label}</Text>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => dismissCall(item.id)}
              activeOpacity={0.7}
            >
              <Check size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  callIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.cardMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  callDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  doneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
