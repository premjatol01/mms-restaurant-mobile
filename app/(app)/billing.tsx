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
import { useBillingStore, InvoiceRecord } from '../../src/store/billingStore';
import { useFloorStore, FloorTable } from '../../src/store/floorStore';
import { usePermissions } from '../../src/hooks/usePermissions';
import { Colors } from '../../src/constants/theme';
import {
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  X,
  Printer,
  Share2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react-native';

export default function BillingScreen() {
  const {
    settledInvoices,
    activeTab,
    setActiveTab,
    settleInvoice,
    loadSettlements,
  } = useBillingStore();

  const { tables, loadTables } = useFloorStore();
  const { user, hasPermission } = usePermissions();

  const canSettle = hasPermission('billing_settle');

  // Selected table to settle
  const [tableToSettle, setTableToSettle] = useState<FloorTable | null>(null);
  const [settleModalVisible, setSettleModalVisible] = useState(false);

  // Settlement Form State
  const [selectedPayMode, setSelectedPayMode] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [discountType, setDiscountType] = useState<number>(0); // discount in ₹
  const [cashTendered, setCashTendered] = useState<string>('');

  // Digital Receipt Modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);

  useEffect(() => {
    loadSettlements();
    loadTables();
  }, []);

  // Filter unpaid tables from floorStore (both occupied and billed)
  const unpaidTables = tables.filter((t) => t.status !== 'available' && t.subtotal > 0);

  // Shift KPI totals
  const totalSettledToday = settledInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalCash = settledInvoices
    .filter((i) => i.paymentMode === 'Cash')
    .reduce((sum, i) => sum + i.total, 0);
  const totalUPI = settledInvoices
    .filter((i) => i.paymentMode === 'UPI')
    .reduce((sum, i) => sum + i.total, 0);
  const totalCard = settledInvoices
    .filter((i) => i.paymentMode === 'Card')
    .reduce((sum, i) => sum + i.total, 0);

  const openSettleModal = (table: FloorTable) => {
    setTableToSettle(table);
    setDiscountType(0);
    setCashTendered('');
    setSelectedPayMode('UPI');
    setSettleModalVisible(true);
  };

  // Calculations for active settlement
  const subtotal = tableToSettle?.subtotal || 0;
  const discountAmount = discountType;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstAmount = Math.round(taxableAmount * 0.05 * 10) / 10; // 5% GST
  const netTotal = taxableAmount + gstAmount;

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeToReturn = Math.max(0, tenderedNum - netTotal);

  const handleConfirmSettlement = async () => {
    if (!tableToSettle) return;

    if (selectedPayMode === 'Cash' && tenderedNum > 0 && tenderedNum < netTotal) {
      Alert.alert('Insufficient Cash', 'Tendered cash is less than the net bill amount.');
      return;
    }

    const invoice = await settleInvoice({
      tableId: tableToSettle.id,
      tableNo: tableToSettle.number,
      serverName: tableToSettle.serverName || 'Floor Staff',
      cashierName: user?.name || 'Counter Cashier',
      items: tableToSettle.items,
      subtotal,
      discount: discountAmount,
      gstAmount,
      total: netTotal,
      paymentMode: selectedPayMode,
      amountTendered: selectedPayMode === 'Cash' ? tenderedNum : undefined,
      changeReturned: selectedPayMode === 'Cash' ? changeToReturn : undefined,
    });

    setSettleModalVisible(false);
    setSelectedInvoice(invoice);
    setReceiptModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Shift Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.kpiMainCard}>
          <View style={styles.kpiMainHeader}>
            <Text style={styles.kpiMainLabel}>Today's Collections</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Counter Open</Text>
            </View>
          </View>
          <Text style={styles.kpiMainTotal}>₹{totalSettledToday.toLocaleString()}</Text>
          <Text style={styles.kpiMainSub}>
            {settledInvoices.length} invoices settled across all tables
          </Text>
        </View>

        {/* Mode breakdown pills */}
        <View style={styles.modesRow}>
          <View style={styles.modePill}>
            <Banknote size={14} color={Colors.emerald} />
            <Text style={styles.modePillLabel}>Cash: </Text>
            <Text style={styles.modePillVal}>₹{totalCash}</Text>
          </View>
          <View style={styles.modePill}>
            <QrCode size={14} color={Colors.blue} />
            <Text style={styles.modePillLabel}>UPI: </Text>
            <Text style={styles.modePillVal}>₹{totalUPI}</Text>
          </View>
          <View style={styles.modePill}>
            <CreditCard size={14} color={Colors.purple} />
            <Text style={styles.modePillLabel}>Card: </Text>
            <Text style={styles.modePillVal}>₹{totalCard}</Text>
          </View>
        </View>
      </View>

      {/* Tabs: Unpaid Tables vs Settled History */}
      <View style={styles.tabSwitchBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'unpaid' && styles.tabButtonActive]}
          onPress={() => setActiveTab('unpaid')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'unpaid' && styles.tabButtonTextActive]}
          >
            Pending Settlement ({unpaidTables.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}
          >
            Settled Invoices ({settledInvoices.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. Unpaid Tables Tab */}
      {activeTab === 'unpaid' ? (
        <FlatList
          data={unpaidTables}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Receipt size={44} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>All Table Bills Settled</Text>
              <Text style={styles.emptySubtitle}>
                No tables currently waiting for cashier payment.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isBilled = item.status === 'billed';
            const tableGST = Math.round(item.subtotal * 0.05 * 10) / 10;
            const tableTotal = item.subtotal + tableGST;

            return (
              <View
                style={[
                  styles.unpaidCard,
                  isBilled && { borderColor: Colors.amber, borderWidth: 1.8 },
                ]}
              >
                <View style={styles.unpaidHeader}>
                  <View>
                    <View style={styles.tableTitleRow}>
                      <Text style={styles.tableNumberText}>{item.number}</Text>
                      {isBilled && (
                        <View style={styles.billRequestedBadge}>
                          <Text style={styles.billRequestedText}>Bill Requested ⚡</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.tableMetaText}>
                      {item.section} • {item.guests} guests • Server: {item.serverName}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.tableTotalText}>₹{tableTotal}</Text>
                    <Text style={styles.itemCountText}>{item.items.length} items</Text>
                  </View>
                </View>

                {/* Items Preview */}
                <View style={styles.itemsPreviewContainer}>
                  {item.items.slice(0, 3).map((dish, i) => (
                    <Text key={i} style={styles.itemPreviewLine} numberOfLines={1}>
                      • {dish.quantity}x {dish.name} (₹{dish.price * dish.quantity})
                    </Text>
                  ))}
                  {item.items.length > 3 && (
                    <Text style={styles.moreItemsText}>
                      + {item.items.length - 3} more items...
                    </Text>
                  )}
                </View>

                <View style={styles.cardDivider} />

                {/* Settle Action */}
                {canSettle ? (
                  <TouchableOpacity
                    style={[
                      styles.settleBtn,
                      isBilled && { backgroundColor: Colors.primary },
                    ]}
                    onPress={() => openSettleModal(item)}
                    activeOpacity={0.8}
                  >
                    <Receipt size={16} color="#FFFFFF" />
                    <Text style={styles.settleBtnText}>
                      {isBilled ? 'Settle & Close Table (₹' + tableTotal + ')' : 'Settle Bill (₹' + tableTotal + ')'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.viewOnlyBadge}>
                    <Text style={styles.viewOnlyText}>Cashier Role Required for Settlement</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      ) : (
        /* 2. Settled Invoices History Tab */
        <FlatList
          data={settledInvoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Receipt size={44} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Invoices Settled Yet</Text>
              <Text style={styles.emptySubtitle}>Settled bills will be archived here.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.invoiceCard}
              onPress={() => {
                setSelectedInvoice(item);
                setReceiptModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.invoiceHeader}>
                <View>
                  <Text style={styles.invoiceNumber}>{item.invoiceNo}</Text>
                  <Text style={styles.invoiceTable}>
                    {item.tableNo} • Cashier: {item.cashierName}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.invoiceTotal}>₹{item.total}</Text>
                  <View
                    style={[
                      styles.payModeBadge,
                      item.paymentMode === 'UPI' && {
                        backgroundColor: Colors.blueLight,
                        borderColor: Colors.blueBorder,
                      },
                      item.paymentMode === 'Cash' && {
                        backgroundColor: Colors.emeraldLight,
                        borderColor: Colors.emeraldBorder,
                      },
                      item.paymentMode === 'Card' && {
                        backgroundColor: Colors.purpleLight,
                        borderColor: Colors.purpleBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.payModeBadgeText,
                        item.paymentMode === 'UPI' && { color: Colors.blue },
                        item.paymentMode === 'Cash' && { color: Colors.emerald },
                        item.paymentMode === 'Card' && { color: Colors.purple },
                      ]}
                    >
                      {item.paymentMode}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.invoiceFooter}>
                <Text style={styles.invoiceItemsCount}>{item.items.length} items ordered</Text>
                <Text style={styles.viewSlipPrompt}>View Receipt Slip →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* POS Settlement Drawer Modal */}
      <Modal
        visible={settleModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettleModalVisible(false)}
      >
        <View style={styles.settleModalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Settle {tableToSettle?.number}</Text>
              <Text style={styles.modalSubtitle}>
                {tableToSettle?.section} • Server: {tableToSettle?.serverName}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSettleModalVisible(false)}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Itemized Order Review */}
            <Text style={styles.sectionHeading}>Order Breakdown</Text>
            <View style={styles.orderBreakdownCard}>
              {tableToSettle?.items.map((item, idx) => (
                <View key={idx} style={styles.breakdownItemRow}>
                  <Text style={styles.breakdownItemQty}>{item.quantity}x</Text>
                  <Text style={styles.breakdownItemName}>{item.name}</Text>
                  <Text style={styles.breakdownItemPrice}>₹{item.price * item.quantity}</Text>
                </View>
              ))}

              <View style={styles.cardDivider} />

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Subtotal</Text>
                <Text style={styles.calcVal}>₹{subtotal}</Text>
              </View>

              {/* Discount Options */}
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Discount</Text>
                <Text style={[styles.calcVal, { color: Colors.emerald }]}>
                  {discountAmount > 0 ? `- ₹${discountAmount}` : '₹0'}
                </Text>
              </View>

              {/* Discount quick buttons */}
              <View style={styles.discountRow}>
                {[0, 50, 100, 200].map((disc) => (
                  <TouchableOpacity
                    key={disc}
                    style={[
                      styles.discPill,
                      discountType === disc && styles.discPillActive,
                    ]}
                    onPress={() => setDiscountType(disc)}
                  >
                    <Text
                      style={[
                        styles.discPillText,
                        discountType === disc && styles.discPillTextActive,
                      ]}
                    >
                      {disc === 0 ? 'No Disc' : `₹${disc} Off`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>GST (5% = CGST 2.5% + SGST 2.5%)</Text>
                <Text style={styles.calcVal}>₹{gstAmount}</Text>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.netTotalRow}>
                <Text style={styles.netTotalLabel}>Net Amount Due</Text>
                <Text style={styles.netTotalVal}>₹{netTotal}</Text>
              </View>
            </View>

            {/* Payment Method Selector */}
            <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Payment Tender Mode</Text>
            <View style={styles.payMethodsGrid}>
              {(['UPI', 'Cash', 'Card'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.payModeCard,
                    selectedPayMode === mode && styles.payModeCardActive,
                  ]}
                  onPress={() => setSelectedPayMode(mode)}
                  activeOpacity={0.7}
                >
                  {mode === 'UPI' && <QrCode size={22} color={selectedPayMode === mode ? '#FFFFFF' : Colors.blue} />}
                  {mode === 'Cash' && <Banknote size={22} color={selectedPayMode === mode ? '#FFFFFF' : Colors.emerald} />}
                  {mode === 'Card' && <CreditCard size={22} color={selectedPayMode === mode ? '#FFFFFF' : Colors.purple} />}
                  <Text
                    style={[
                      styles.payModeCardText,
                      selectedPayMode === mode && styles.payModeCardTextActive,
                    ]}
                  >
                    {mode === 'UPI' ? 'UPI QR' : mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cash Tender & Change Calculator */}
            {selectedPayMode === 'Cash' && (
              <View style={styles.cashCalculatorCard}>
                <Text style={styles.calcSectionTitle}>Cash Tendered by Customer</Text>
                <TextInput
                  style={styles.cashInput}
                  placeholder={`Enter cash amount (e.g. ₹${Math.ceil(netTotal / 100) * 100})`}
                  keyboardType="numeric"
                  value={cashTendered}
                  onChangeText={setCashTendered}
                />
                {tenderedNum > 0 && (
                  <View style={styles.changeReturnRow}>
                    <Text style={styles.changeLabel}>Change to Return to Guest:</Text>
                    <Text style={styles.changeVal}>₹{changeToReturn}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Confirm Payment Button */}
            <TouchableOpacity
              style={styles.confirmSettleBtn}
              onPress={handleConfirmSettlement}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.confirmSettleText}>
                Confirm Settlement & Free {tableToSettle?.number}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Digital Bill Receipt Modal */}
      <Modal
        visible={receiptModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View style={styles.receiptContainer}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptHeaderTitle}>Tax Invoice / Receipt</Text>
            <TouchableOpacity onPress={() => setReceiptModalVisible(false)}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.receiptBody} showsVerticalScrollIndicator={false}>
            {/* Printable Slip Paper */}
            <View style={styles.paperReceipt}>
              <View style={styles.paperBrand}>
                <Text style={styles.paperBrandName}>TABLLY GRAND BISTRO</Text>
                <Text style={styles.paperBrandAddress}>
                  104 MG Road, Indiranagar, Bengaluru
                </Text>
                <Text style={styles.paperBrandGST}>GSTIN: 29AABCU9603R1ZM</Text>
              </View>

              <View style={styles.paperDividerDashed} />

              <View style={styles.paperMetaRow}>
                <Text style={styles.paperMetaText}>Invoice: {selectedInvoice?.invoiceNo}</Text>
                <Text style={styles.paperMetaText}>{selectedInvoice?.tableNo}</Text>
              </View>
              <View style={styles.paperMetaRow}>
                <Text style={styles.paperMetaText}>Cashier: {selectedInvoice?.cashierName}</Text>
                <Text style={styles.paperMetaText}>Server: {selectedInvoice?.serverName}</Text>
              </View>

              <View style={styles.paperDividerDashed} />

              {/* Items List */}
              <View style={styles.paperItemsWrapper}>
                <View style={styles.paperTableHeader}>
                  <Text style={[styles.paperTh, { flex: 2 }]}>ITEM</Text>
                  <Text style={[styles.paperTh, { flex: 0.8, textAlign: 'center' }]}>QTY</Text>
                  <Text style={[styles.paperTh, { flex: 1, textAlign: 'right' }]}>AMT</Text>
                </View>

                {selectedInvoice?.items.map((it, idx) => (
                  <View key={idx} style={styles.paperTableRow}>
                    <Text style={[styles.paperTd, { flex: 2 }]}>{it.name}</Text>
                    <Text style={[styles.paperTd, { flex: 0.8, textAlign: 'center' }]}>{it.quantity}</Text>
                    <Text style={[styles.paperTd, { flex: 1, textAlign: 'right' }]}>₹{it.price * it.quantity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.paperDividerDashed} />

              <View style={styles.paperCalcRow}>
                <Text style={styles.paperCalcText}>Subtotal:</Text>
                <Text style={styles.paperCalcText}>₹{selectedInvoice?.subtotal}</Text>
              </View>
              {selectedInvoice?.discount ? (
                <View style={styles.paperCalcRow}>
                  <Text style={styles.paperCalcText}>Discount:</Text>
                  <Text style={styles.paperCalcText}>- ₹{selectedInvoice.discount}</Text>
                </View>
              ) : null}
              <View style={styles.paperCalcRow}>
                <Text style={styles.paperCalcText}>CGST (2.5%):</Text>
                <Text style={styles.paperCalcText}>₹{((selectedInvoice?.gstAmount || 0) / 2).toFixed(1)}</Text>
              </View>
              <View style={styles.paperCalcRow}>
                <Text style={styles.paperCalcText}>SGST (2.5%):</Text>
                <Text style={styles.paperCalcText}>₹{((selectedInvoice?.gstAmount || 0) / 2).toFixed(1)}</Text>
              </View>

              <View style={styles.paperDividerDashed} />

              <View style={styles.paperFinalRow}>
                <Text style={styles.paperFinalLabel}>TOTAL PAID ({selectedInvoice?.paymentMode}):</Text>
                <Text style={styles.paperFinalAmount}>₹{selectedInvoice?.total}</Text>
              </View>

              <View style={styles.paperDividerDashed} />

              <View style={styles.paperFooter}>
                <Text style={styles.thankYouText}>Thank you for dining with Tablly!</Text>
                <Text style={styles.feedbackText}>Scan table QR for 5-star Google review rewards</Text>
              </View>
            </View>

            {/* Print & Share Actions */}
            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={styles.actionPillBtn}
                onPress={() => Alert.alert('Printing Slip', 'Sending invoice to Bluetooth POS printer...')}
              >
                <Printer size={16} color={Colors.text} />
                <Text style={styles.actionPillText}>Print Slip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionPillBtn}
                onPress={() => Alert.alert('Share Invoice', 'Sending digital receipt via WhatsApp...')}
              >
                <Share2 size={16} color={Colors.text} />
                <Text style={styles.actionPillText}>Share WhatsApp</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
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
  summaryContainer: {
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  kpiMainCard: {
    marginBottom: 12,
  },
  kpiMainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiMainLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.emerald,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emerald,
  },
  kpiMainTotal: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginVertical: 4,
  },
  kpiMainSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  modesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  modePillLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  modePillVal: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  tabSwitchBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  unpaidCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  unpaidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tableTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableNumberText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  billRequestedBadge: {
    backgroundColor: Colors.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  billRequestedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.amber,
  },
  tableMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tableTotalText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  itemCountText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  itemsPreviewContainer: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 4,
  },
  itemPreviewLine: {
    fontSize: 12,
    color: Colors.text,
  },
  moreItemsText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.emerald,
    height: 44,
    borderRadius: 12,
  },
  settleBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  viewOnlyBadge: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  viewOnlyText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  invoiceCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  invoiceTable: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  invoiceTotal: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  payModeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  payModeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceItemsCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  viewSlipPrompt: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
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
  settleModalContainer: {
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
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalBody: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  orderBreakdownCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownItemQty: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    width: 24,
  },
  breakdownItemName: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  breakdownItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  calcLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  discountRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 8,
  },
  discPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discPillActive: {
    backgroundColor: Colors.emerald,
    borderColor: Colors.emerald,
  },
  discPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  discPillTextActive: {
    color: '#FFFFFF',
  },
  netTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  netTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  netTotalVal: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  payMethodsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  payModeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  payModeCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  payModeCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  payModeCardTextActive: {
    color: '#FFFFFF',
  },
  cashCalculatorCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  calcSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  cashInput: {
    height: 44,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.text,
  },
  changeReturnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  changeVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.emerald,
  },
  confirmSettleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 14,
  },
  confirmSettleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  receiptContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  receiptHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  receiptBody: {
    padding: 16,
  },
  paperReceipt: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  paperBrand: {
    alignItems: 'center',
  },
  paperBrandName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#0F172A',
  },
  paperBrandAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  paperBrandGST: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  paperDividerDashed: {
    height: 1,
    borderWidth: 0.8,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  paperMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  paperMetaText: {
    fontSize: 11,
    color: '#475569',
  },
  paperItemsWrapper: {
    marginVertical: 4,
  },
  paperTableHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
  },
  paperTh: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  paperTableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  paperTd: {
    fontSize: 12,
    color: '#1E293B',
  },
  paperCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  paperCalcText: {
    fontSize: 11,
    color: '#475569',
  },
  paperFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  paperFinalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  paperFinalAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  paperFooter: {
    alignItems: 'center',
    gap: 2,
  },
  thankYouText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  feedbackText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
});
