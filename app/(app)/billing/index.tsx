import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../../src/constants/theme';
import { Receipt, CreditCard, Banknote, QrCode, CheckCircle2 } from 'lucide-react-native';

interface UnpaidSession {
  id: string;
  tableNo: string;
  orderNumber: string;
  subtotal: number;
  gst: number;
  total: number;
  timeSeated: string;
}

const INITIAL_UNPAID: UnpaidSession[] = [
  { id: 'b1', tableNo: 'Table 5', orderNumber: '#ORD-2041', subtotal: 800, gst: 40, total: 840, timeSeated: '1h 10m' },
  { id: 'b2', tableNo: 'Table 2', orderNumber: '#ORD-2039', subtotal: 1200, gst: 60, total: 1260, timeSeated: '45m' },
  { id: 'b3', tableNo: 'Table 9', orderNumber: '#ORD-2038', subtotal: 2150, gst: 107.5, total: 2257.5, timeSeated: '1h 25m' },
];

export default function BillingScreen() {
  const [sessions, setSessions] = useState<UnpaidSession[]>(INITIAL_UNPAID);

  const settleBill = (session: UnpaidSession, method: string) => {
    Alert.alert(
      'Confirm Payment',
      `Settle ${session.tableNo} (${session.orderNumber}) for ₹${session.total} via ${method}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle & Print Slip',
          onPress: () => {
            setSessions((prev) => prev.filter((s) => s.id !== session.id));
            Alert.alert('Payment Received', `${session.tableNo} bill settled successfully.`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Receipt size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>All Tables Settled</Text>
            <Text style={styles.emptySubtitle}>No pending bills waiting for payment.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.billingCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.tableText}>{item.tableNo}</Text>
                <Text style={styles.orderNumberText}>{item.orderNumber}</Text>
              </View>
              <Text style={styles.totalAmountText}>₹{item.total}</Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>₹{item.subtotal}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>GST (5%)</Text>
              <Text style={styles.breakdownValue}>₹{item.gst}</Text>
            </View>

            <View style={styles.cardDivider} />

            {/* Quick Payment Settlement Options */}
            <Text style={styles.paymentMethodPrompt}>Select Settlement Mode:</Text>
            <View style={styles.paymentRow}>
              <TouchableOpacity
                style={[styles.payMethodBtn, { borderColor: Colors.emeraldBorder }]}
                onPress={() => settleBill(item, 'Cash')}
              >
                <Banknote size={16} color={Colors.emerald} />
                <Text style={[styles.payMethodText, { color: Colors.emerald }]}>Cash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payMethodBtn, { borderColor: Colors.blueBorder }]}
                onPress={() => settleBill(item, 'UPI / QR')}
              >
                <QrCode size={16} color={Colors.blue} />
                <Text style={[styles.payMethodText, { color: Colors.blue }]}>UPI QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payMethodBtn, { borderColor: Colors.purpleBorder }]}
                onPress={() => settleBill(item, 'Card')}
              >
                <CreditCard size={16} color={Colors.purple} />
                <Text style={[styles.payMethodText, { color: Colors.purple }]}>Card</Text>
              </TouchableOpacity>
            </View>
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
    gap: 14,
  },
  billingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  orderNumberText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  totalAmountText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentMethodPrompt: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  payMethodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
  },
  payMethodText: {
    fontSize: 13,
    fontWeight: '700',
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
