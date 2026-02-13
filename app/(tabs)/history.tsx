import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenFlatList } from '@/components/ui/ScreenFlatList';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ErrorWithRetry } from '@/components/ui/ErrorWithRetry';
import { useHistory, type HistoryItem } from '@/hooks/useHistory';
import { MOVEMENT_TYPE_LABELS } from '@/constants/movementTypes';
import { useCustomers } from '@/hooks/useCustomers';
import { useCylinderTypes } from '@/hooks/useCylinderTypes';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { FinanceTransactionType } from '@/lib/types';

function formatMoney(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TRANSACTION_TYPE_LABELS: Record<FinanceTransactionType, string> = {
  sale_cash: 'Sale (Cash)',
  sale_credit: 'Sale (Credit)',
  payment: 'Payment',
  refill: 'Refill',
  expense: 'Expense',
  add: 'Add',
};

export default function HistoryScreen() {
  const { items, isLoading, isError, error, refetch } = useHistory();
  const { customers } = useCustomers();
  const { cylinderTypes } = useCylinderTypes();

  const getCustomer = (customerId?: string) => {
    if (!customerId) return null;
    return customers.find((c) => c.id === customerId);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'swap':
        return 'swap-horizontal';
      case 'loan':
        return 'arrow-forward-circle';
      case 'return':
        return 'arrow-back-circle';
      case 'restock':
        return 'add-circle';
      case 'add':
        return 'cube-outline';
      default:
        return 'ellipse';
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'swap':
        return colors.success;
      case 'loan':
        return colors.warning;
      case 'return':
        return colors.primary;
      case 'restock':
        return colors.accent;
      case 'add':
        return colors.primaryDark;
      default:
        return colors.textSecondary;
    }
  };

  const getMovementTypeLabel = (m: { type: string; addKind?: string }) =>
    m.type === 'add' && m.addKind ? `Add (${m.addKind})` : MOVEMENT_TYPE_LABELS[m.type as keyof typeof MOVEMENT_TYPE_LABELS];

  const getTransactionIcon = (type: FinanceTransactionType) => {
    switch (type) {
      case 'sale_cash':
      case 'sale_credit':
        return 'cash-outline';
      case 'payment':
        return 'wallet-outline';
      case 'refill':
        return 'flask-outline';
      case 'expense':
        return 'remove-circle-outline';
      case 'add':
        return 'cube-outline';
      default:
        return 'ellipse';
    }
  };

  const getTransactionColor = (type: FinanceTransactionType) => {
    switch (type) {
      case 'sale_cash':
      case 'sale_credit':
        return colors.success;
      case 'payment':
        return colors.primary;
      case 'refill':
      case 'expense':
      case 'add':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <ScreenFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.headerContent}>
                <Text style={styles.title}>History</Text>
                <Text style={styles.subtitle}>Activity timeline</Text>
              </View>
            </View>
            <SkeletonList count={6} />
          </View>
        }
      />
    );
  }

  if (isError) {
    return (
      <ScreenFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.headerContent}>
                <Text style={styles.title}>History</Text>
                <Text style={styles.subtitle}>Activity timeline</Text>
              </View>
            </View>
            <ErrorWithRetry
              message={error?.message ?? 'Error loading history.'}
              onRetry={() => refetch()}
            />
          </View>
        }
      />
    );
  }

  return (
    <ScreenFlatList<HistoryItem>
      data={items}
      keyExtractor={(item) => `${item.type}-${item.data.id}`}
      renderItem={({ item }) => {
        const historyItem = item as HistoryItem;
        
        // If this is a transaction with a linked movement, render them together
        if (historyItem.type === 'transaction' && historyItem.movement) {
          const transaction = historyItem.data;
          const movement = historyItem.movement;
          const cylinderType = cylinderTypes.find((ct) => ct.id === movement.cylinderTypeId);
          const customer = getCustomer(transaction.customerId || movement.customerId);
          const transactionColor = getTransactionColor(transaction.type);
          
          return (
            <Card variant="default" style={styles.movementCard}>
              <View style={styles.movementHeader}>
                <View style={[styles.movementIconContainer, { backgroundColor: transactionColor + '15' }]}>
                  <Ionicons name={getTransactionIcon(transaction.type)} size={20} color={transactionColor} />
                </View>
                <View style={styles.movementContent}>
                  <View style={styles.movementTitleRow}>
                    <Text style={styles.movementType}>
                      {TRANSACTION_TYPE_LABELS[transaction.type]} • {getMovementTypeLabel(movement)}
                    </Text>
                    <Text style={styles.movementDate}>{formatDate(transaction.createdAt)}</Text>
                  </View>
                  <View style={styles.movementDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailText, styles.amountText]}>
                        {formatMoney(transaction.amount)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>
                        {cylinderType?.label ?? movement.cylinderTypeId} • Qty: {movement.quantity}
                      </Text>
                    </View>
                    {customer && (
                      <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{customer.name}</Text>
                      </View>
                    )}
                  </View>
                  {(transaction.notes || movement.notes) && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notes}>{transaction.notes || movement.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          );
        }
        
        // If this is a movement without a linked transaction
        if (historyItem.type === 'movement') {
          const movement = historyItem.data;
          const cylinderType = cylinderTypes.find((ct) => ct.id === movement.cylinderTypeId);
          const customer = getCustomer(movement.customerId);
          const movementColor = getMovementColor(movement.type);
          
          return (
            <Card variant="default" style={styles.movementCard}>
              <View style={styles.movementHeader}>
                <View style={[styles.movementIconContainer, { backgroundColor: movementColor + '15' }]}>
                  <Ionicons name={getMovementIcon(movement.type)} size={20} color={movementColor} />
                </View>
                <View style={styles.movementContent}>
                  <View style={styles.movementTitleRow}>
                    <Text style={styles.movementType}>{getMovementTypeLabel(movement)}</Text>
                    <Text style={styles.movementDate}>{formatDate(movement.createdAt)}</Text>
                  </View>
                  <View style={styles.movementDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>
                        {cylinderType?.label ?? movement.cylinderTypeId} • Qty: {movement.quantity}
                      </Text>
                    </View>
                    {customer && (
                      <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{customer.name}</Text>
                      </View>
                    )}
                  </View>
                  {movement.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notes}>{movement.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          );
        }
        
        // If this is a transaction without a linked movement
        const transaction = historyItem.data;
        const customer = getCustomer(transaction.customerId);
        const transactionColor = getTransactionColor(transaction.type);
        
        return (
          <Card variant="default" style={styles.movementCard}>
            <View style={styles.movementHeader}>
              <View style={[styles.movementIconContainer, { backgroundColor: transactionColor + '15' }]}>
                <Ionicons name={getTransactionIcon(transaction.type)} size={20} color={transactionColor} />
              </View>
              <View style={styles.movementContent}>
                <View style={styles.movementTitleRow}>
                  <Text style={styles.movementType}>{TRANSACTION_TYPE_LABELS[transaction.type]}</Text>
                  <Text style={styles.movementDate}>{formatDate(transaction.createdAt)}</Text>
                </View>
                <View style={styles.movementDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, styles.amountText]}>
                      {formatMoney(transaction.amount)}
                    </Text>
                  </View>
                  {customer && (
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{customer.name}</Text>
                    </View>
                  )}
                </View>
                {transaction.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notes}>{transaction.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        );
      }}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.title}>History</Text>
              <Text style={styles.subtitle}>Activity timeline</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Timeline</Text>
            <Text style={styles.sectionSubtitle}>{items.length} {items.length === 1 ? 'record' : 'records'}</Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptyText}>Activity records will appear here</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  movementCard: {
    marginVertical: spacing.sm,
  },
  movementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  movementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  movementContent: {
    flex: 1,
  },
  movementTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  movementDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  notesContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  notes: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  amountText: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
});
