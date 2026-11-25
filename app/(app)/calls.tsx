import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useWaiterCallsStore, ServiceCall } from '../../src/store/waiterCallsStore';
import { usePermissions } from '../../src/hooks/usePermissions';
import { Colors } from '../../src/constants/theme';
import {
  Bell,
  Droplets,
  Receipt,
  UserCheck,
  Check,
  Sparkles,
  Clock,
  HelpCircle,
} from 'lucide-react-native';

export default function CallsScreen() {
  const { calls, filterType, setFilterType, dismissCall, simulateGuestCall, loadCalls } =
    useWaiterCallsStore();
  const { hasPermission } = usePermissions();

  const canHandleCalls = hasPermission('waiter_handler');

  useEffect(() => {
    loadCalls();
  }, []);

  const filteredCalls = calls.filter((c) => {
    if (filterType === 'all') return true;
    return c.type === filterType;
  });

  const getCallIcon = (type: ServiceCall['type']) => {
    switch (type) {
      case 'water':
        return <Droplets size={20} color={Colors.blue} />;
      case 'bill':
        return <Receipt size={20} color={Colors.emerald} />;
      case 'steward':
        return <UserCheck size={20} color={Colors.amber} />;
    }
  };

  const getElapsedTimeText = (createdAt: number) => {
    const elapsedMinutes = Math.floor((Date.now() - createdAt) / 60000);
    if (elapsedMinutes < 1) return 'Just now';
    return `${elapsedMinutes}m ago`;
  };

  return (
    <View style={styles.container}>
      {/* Simulation Banner */}
      <View style={styles.simBanner}>
        <TouchableOpacity
          style={styles.simButton}
          onPress={simulateGuestCall}
          activeOpacity={0.8}
        >
          <Sparkles size={14} color="#FFFFFF" />
          <Text style={styles.simButtonText}>
            ⚡ Simulate Diner Service Call (Test Waiter Alert)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['all', 'water', 'bill', 'steward'] as const).map((ft) => {
          const count = ft === 'all' ? calls.length : calls.filter((c) => c.type === ft).length;
          const isActive = filterType === ft;
          const label =
            ft === 'all'
              ? 'All Calls'
              : ft === 'water'
              ? 'Water'
              : ft === 'bill'
              ? 'Bill Requests'
              : 'Captain';

          return (
            <TouchableOpacity
              key={ft}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilterType(ft)}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Calls List */}
      <FlatList
        data={filteredCalls}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Pending Table Calls</Text>
            <Text style={styles.emptySubtitle}>
              All guest table service requests have been completed.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.callCard}>
            <View style={styles.callIconBox}>{getCallIcon(item.type)}</View>

            <View style={{ flex: 1 }}>
              <View style={styles.callHeader}>
                <Text style={styles.tableText}>{item.tableNo}</Text>
                <View style={styles.timeRow}>
                  <Clock size={11} color={Colors.textSecondary} />
                  <Text style={styles.timeText}>{getElapsedTimeText(item.createdAt)}</Text>
                </View>
              </View>

              <Text style={styles.callLabel}>{item.label}</Text>
              {item.detail && <Text style={styles.callDetail}>{item.detail}</Text>}
            </View>

            {canHandleCalls && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => dismissCall(item.id)}
                activeOpacity={0.7}
              >
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
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
  simBanner: {
    padding: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  simButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    gap: 12,
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  callIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  callLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  callDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  doneButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
