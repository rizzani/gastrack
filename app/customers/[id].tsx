import { View, Text, StyleSheet, Linking, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { ErrorWithRetry } from '@/components/ui/ErrorWithRetry';
import { useCustomers } from '@/hooks/useCustomers';
import { useHistory } from '@/hooks/useHistory';
import { useOwed } from '@/hooks/useOwed';
import { useFinance } from '@/hooks/useFinance';
import { useCylinderTypes } from '@/hooks/useCylinderTypes';
import { MOVEMENT_TYPE_LABELS } from '@/constants/movementTypes';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { Movement } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';

function formatMoney(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CustomerDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customers, isLoading, isError, error, refetch } = useCustomers();
  const { items: historyItems, isLoading: isHistoryLoading } = useHistory();
  const { byCustomer: owedByCustomer, isLoading: isOwedLoading } = useOwed();
  const { cylinderTypes } = useCylinderTypes();
  const { createTransaction, outstandingLoading, outstanding } = useFinance();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const customer = customers.find((c) => c.id === id);

  if (isLoading) {
    return (
      <Screen>
        <Skeleton width={140} height={32} style={styles.skeleton} />
        <Skeleton width="100%" height={56} style={styles.skeleton} />
        <Skeleton width="100%" height={120} style={styles.skeleton} />
        <SkeletonList count={3} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorWithRetry
          message={error?.message ?? 'Error loading customer.'}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  if (!customer) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>Customer not found</Text>
          <Button title="Go Back" onPress={() => router.back()} style={styles.backButton} />
        </View>
      </Screen>
    );
  }

  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleEdit = () => {
    router.push({ pathname: '/customers/edit', params: { id: customer.id } });
  };

  const getCylinderLabel = (id: string) => {
    const type = cylinderTypes.find((ct) => ct.id === id);
    return type?.label ?? id;
  };

  const customerOwedGroup = owedByCustomer.find((g) => g.customerId === customer.id);
  const totalOwed = customerOwedGroup
    ? customerOwedGroup.records.reduce((sum, r) => sum + r.quantity, 0)
    : 0;

  const creditBalance = useMemo(
    () => outstanding.find((b) => b.customerId === customer.id)?.balance ?? 0,
    [customer.id, outstanding]
  );

  // Set default payment amount to outstanding balance when form is shown
  useEffect(() => {
    if (showPaymentForm && creditBalance > 0) {
      setPaymentAmount(creditBalance.toString());
    } else if (!showPaymentForm) {
      setPaymentAmount('');
    }
  }, [showPaymentForm, creditBalance]);

  // Include both standalone movements and those linked to finance (e.g. loan+ sale_credit).
  // Exclude restock — it's inventory-only, not customer activity.
  const customerMovements = useMemo(() => {
    const seen = new Set<string>();
    const withDate: { m: Movement; createdAt: string }[] = [];
    for (const it of historyItems) {
      const m = it.type === 'movement' ? it.data : it.movement;
      if (!m || m.type === 'restock' || m.customerId !== customer.id) continue;
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      withDate.push({ m, createdAt: m.createdAt });
    }
    withDate.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return withDate.slice(0, 5).map((x) => x.m);
  }, [historyItems, customer.id]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleSavePayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive payment amount.');
      return;
    }
    if (amount > creditBalance) {
      Alert.alert(
        'Too high',
        `Payment amount (${formatMoney(amount)}) exceeds outstanding balance (${formatMoney(
          creditBalance
        )}).`
      );
      return;
    }

    setIsSavingPayment(true);
    try {
      await createTransaction({
        type: 'payment',
        amount,
        customerId: customer.id,
      });
      setPaymentAmount('');
      setShowPaymentForm(false);
      Alert.alert('Success', 'Payment recorded.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to record payment.');
    } finally {
      setIsSavingPayment(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          {customer.phone && (
            <Pressable onPress={handleCall} style={styles.phoneIconButton} hitSlop={8}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </Pressable>
          )}
          <View style={styles.headerMain}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <Text style={styles.name}>{customer.name}</Text>
            {customer.phone && (
              <Text style={styles.phoneText}>{customer.phone}</Text>
            )}
          </View>
          <Pressable onPress={handleEdit} style={styles.editIconButton} hitSlop={8}>
            <Ionicons name="create-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          {customer.notes ? (
            <View style={styles.notesBlock}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{customer.notes}</Text>
            </View>
          ) : null}
        </View>

        {(outstandingLoading || creditBalance > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outstanding credit</Text>
            {outstandingLoading ? (
              <SkeletonList count={1} />
            ) : (
              <Card variant="default" style={styles.creditCard}>
                <View style={styles.creditBalanceContainer}>
                  <View style={styles.creditBalanceHeader}>
                    <View style={styles.creditIcon}>
                      <Ionicons name="wallet-outline" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.creditLabel}>Outstanding Balance</Text>
                  </View>
                  <Text style={styles.creditAmount}>{formatMoney(creditBalance)}</Text>
                  <Text style={styles.creditSubtitle}>
                    Record customer payments against credit sales
                  </Text>
                </View>
                {creditBalance > 0 && !showPaymentForm && (
                  <Button
                    title="Record payment"
                    size="sm"
                    onPress={() => setShowPaymentForm(true)}
                    style={styles.creditButton}
                  />
                )}
                {showPaymentForm && (
                  <View style={styles.paymentForm}>
                    <Input
                      label="Payment amount"
                      placeholder="0"
                      value={paymentAmount}
                      onChangeText={setPaymentAmount}
                      onFocus={() => setPaymentAmount('')}
                      keyboardType="decimal-pad"
                    />
                    <View style={styles.paymentActions}>
                      <Button
                        title="Cancel"
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          setShowPaymentForm(false);
                          setPaymentAmount('');
                        }}
                        style={styles.paymentActionButton}
                      />
                      <Button
                        title="Save payment"
                        size="sm"
                        onPress={handleSavePayment}
                        loading={isSavingPayment}
                        disabled={isSavingPayment}
                        style={styles.paymentActionButton}
                      />
                    </View>
                  </View>
                )}
              </Card>
            )}
          </View>
        )}

        {(isOwedLoading || totalOwed > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Owed cylinders</Text>
            {isOwedLoading ? (
              <SkeletonList count={1} />
            ) : (
              <Pressable
                delayLongPress={300}
                onLongPress={() => {
                  const firstRecord = customerOwedGroup?.records[0];
                  if (firstRecord) {
                    router.push({
                      pathname: '/(tabs)/ledger',
                      params: {
                        selectedCustomerId: customer.id,
                        selectedCylinderTypeId: firstRecord.cylinderTypeId,
                        movementType: 'return',
                        quantity: String(firstRecord.quantity),
                      },
                    });
                  }
                }}
                style={({ pressed }) => [
                  styles.owedCardPressable,
                  pressed && styles.owedCardPressed,
                ]}
              >
                <Card variant="default" style={styles.owedCard}>
                  <View style={styles.owedHeader}>
                    <View style={styles.owedIcon}>
                      <Ionicons name="cube-outline" size={20} color={colors.warning} />
                    </View>
                    <View style={styles.owedHeaderContent}>
                      <Text style={styles.owedTitle}>{totalOwed} cylinders owed</Text>
                      <Text style={styles.owedSubtitle}>Across {customerOwedGroup?.records.length ?? 0} sizes</Text>
                    </View>
                  </View>
                  <View style={styles.owedList}>
                    {customerOwedGroup?.records.map((r) => (
                      <View key={r.cylinderTypeId} style={styles.owedRow}>
                        <Text style={styles.owedLabel}>{getCylinderLabel(r.cylinderTypeId)}</Text>
                        <Text style={styles.owedQty}>{r.quantity}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Recent movements</Text>
            {customerMovements.length > 0 && (
              <Text style={styles.historyCount}>{customerMovements.length} shown</Text>
            )}
          </View>
          {isHistoryLoading ? (
            <SkeletonList count={2} />
          ) : customerMovements.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No movements recorded for this customer yet.</Text>
            </View>
          ) : (
            customerMovements.map((m: Movement) => (
              <Card key={m.id} variant="default" style={styles.movementCard}>
                <View style={styles.movementTopRow}>
                  <Text style={styles.movementType}>{MOVEMENT_TYPE_LABELS[m.type]}</Text>
                  <Text style={styles.movementDate}>{formatDate(m.createdAt)}</Text>
                </View>
                <View style={styles.movementMetaRow}>
                  <Text style={styles.movementMeta}>
                    {getCylinderLabel(m.cylinderTypeId)} • Qty {m.quantity}
                  </Text>
                </View>
                {m.notes && <Text style={styles.movementNotes}>{m.notes}</Text>}
              </Card>
            ))
          )}
        </View>

      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeleton: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.h4,
    color: colors.error,
    marginBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  headerMain: {
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  phoneIconButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: spacing.xs,
  },
  phoneText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  editIconButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textTertiary,
  },
  notesBlock: {
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
  },
  notesLabel: {
    ...typography.smallSemibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notesText: {
    ...typography.body,
    color: colors.text,
  },
  owedCard: {
    marginTop: spacing.xs,
  },
  owedCardPressable: {
    borderRadius: borderRadius.md,
  },
  owedCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.8,
  },
  owedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  owedIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  owedHeaderContent: {
    flex: 1,
  },
  owedTitle: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  owedSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  owedList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  owedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  owedRowPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.7,
  },
  owedLabel: {
    ...typography.small,
    color: colors.text,
  },
  owedQty: {
    ...typography.smallSemibold,
    color: colors.warning,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  historyCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  movementCard: {
    marginVertical: spacing.xs,
  },
  movementTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movementType: {
    ...typography.bodySemibold,
    color: colors.text,
    flex: 1,
  },
  movementDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  movementMetaRow: {
    marginTop: spacing.xs,
  },
  movementMeta: {
    ...typography.small,
    color: colors.textSecondary,
  },
  movementNotes: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  emptyText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  editButton: {
    marginTop: spacing.md,
  },
  creditCard: {
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  creditBalanceContainer: {
    padding: spacing.lg,
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  creditBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  creditIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  creditLabel: {
    ...typography.smallSemibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creditAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  creditSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  creditButton: {
    marginTop: spacing.sm,
  },
  paymentForm: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  paymentActionButton: {
    flex: 1,
  },
});
