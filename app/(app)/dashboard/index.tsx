import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../../src/constants/theme';
import { TrendingUp, ShoppingBag, Users, Clock, ArrowUpRight, DollarSign, Store } from 'lucide-react-native';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Restaurant Header Banner */}
      <View style={styles.restaurantBanner}>
        <View style={styles.restaurantInfo}>
          <Store size={20} color={Colors.primary} />
          <View>
            <Text style={styles.restaurantName}>Tablly Grand Bistro</Text>
            <Text style={styles.restaurantSubtitle}>Branch #1 • Downtown Floor</Text>
          </View>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.livePulse} />
          <Text style={styles.liveText}>Floor Open</Text>
        </View>
      </View>

      {/* Primary Revenue Card */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueHeader}>
          <Text style={styles.revenueLabel}>Today's Gross Sales</Text>
          <View style={styles.growthBadge}>
            <TrendingUp size={12} color={Colors.emerald} />
            <Text style={styles.growthText}>+18.4%</Text>
          </View>
        </View>
        <Text style={styles.revenueValue}>₹48,250</Text>
        <Text style={styles.revenueSubtext}>Across 64 completed table orders</Text>
      </View>

      {/* Key Metric Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: Colors.emeraldLight }]}>
            <ShoppingBag size={18} color={Colors.emerald} />
          </View>
          <Text style={styles.statNumber}>18</Text>
          <Text style={styles.statLabel}>Active Orders</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: Colors.blueLight }]}>
            <Users size={18} color={Colors.blue} />
          </View>
          <Text style={styles.statNumber}>78%</Text>
          <Text style={styles.statLabel}>Table Occupancy</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: Colors.amberLight }]}>
            <Clock size={18} color={Colors.amber} />
          </View>
          <Text style={styles.statNumber}>14 min</Text>
          <Text style={styles.statLabel}>Avg Cook Time</Text>
        </View>
      </View>

      {/* Floor Overview Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Floor Status Overview</Text>
      </View>

      <View style={styles.floorStatusCard}>
        <View style={styles.floorRow}>
          <Text style={styles.floorStatusLabel}>Occupied Tables</Text>
          <Text style={[styles.floorStatusValue, { color: Colors.rose }]}>14 of 18</Text>
        </View>
        <View style={styles.floorDivider} />
        <View style={styles.floorRow}>
          <Text style={styles.floorStatusLabel}>Available Tables</Text>
          <Text style={[styles.floorStatusValue, { color: Colors.emerald }]}>4 tables</Text>
        </View>
        <View style={styles.floorDivider} />
        <View style={styles.floorRow}>
          <Text style={styles.floorStatusLabel}>Pending KDS Tickets</Text>
          <Text style={[styles.floorStatusValue, { color: Colors.amber }]}>6 tickets</Text>
        </View>
      </View>

      {/* Top Performing Dishes */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Top Dishes</Text>
      </View>

      <View style={styles.topDishesCard}>
        {[
          { name: 'Paneer Butter Masala', qty: 32, rev: '₹10,240' },
          { name: 'Crispy Garlic Naan', qty: 58, rev: '₹4,640' },
          { name: 'Tandoori Chicken Platter', qty: 24, rev: '₹9,600' },
        ].map((item, idx) => (
          <View key={idx} style={styles.dishRow}>
            <View style={styles.dishRank}>
              <Text style={styles.dishRankText}>#{idx + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dishName}>{item.name}</Text>
              <Text style={styles.dishQty}>{item.qty} portions sold</Text>
            </View>
            <Text style={styles.dishRev}>{item.rev}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  restaurantBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  restaurantSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emerald,
  },
  revenueCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.emerald,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginVertical: 6,
  },
  revenueSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  floorStatusCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  floorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floorDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  floorStatusLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  floorStatusValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  topDishesCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  dishRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  dishQty: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  dishRev: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
});
