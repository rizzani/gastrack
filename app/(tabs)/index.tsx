import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenFlatList } from '@/components/ui/ScreenFlatList';
import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { useFinance, useSummaryTotals } from '@/hooks/useFinance';
import { useInventory } from '@/hooks/useInventory';
import { useCustomers } from '@/hooks/useCustomers';
import { useOwed } from '@/hooks/useOwed';
import { useCylinderTypes } from '@/hooks/useCylinderTypes';
import { useAuth } from '@/contexts/AuthContext';
import { todayRange } from '@/lib/dateUtils';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

function formatMoney(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const today = useMemo(() => todayRange(), []);
  const { totals: todayTotals, isLoading: todayLoading } = useSummaryTotals(today);
  const { outstanding, outstandingLoading } = useFinance();
  const { list: inventory, isLoading: inventoryLoading } = useInventory();
  const { customers, isLoading: customersLoading } = useCustomers();
  const { list: owed, isLoading: owedLoading } = useOwed();
  const { cylinderTypes } = useCylinderTypes();

  const totalOutstanding = outstanding.reduce((s, b) => s + b.balance, 0);
  const todayProfit = todayTotals.sales - todayTotals.refills - todayTotals.expenses;
  
  const totalInventory = inventory.reduce(
    (acc, inv) => acc + inv.full + inv.empty + inv.damaged,
    0
  );
  const totalFull = inventory.reduce((acc, inv) => acc + inv.full, 0);
  const totalEmpty = inventory.reduce((acc, inv) => acc + inv.empty, 0);
  const totalDamaged = inventory.reduce((acc, inv) => acc + inv.damaged, 0);

  const totalOwed = owed.reduce((acc, o) => acc + o.quantity, 0);

  const isLoading = todayLoading || outstandingLoading || inventoryLoading || customersLoading || owedLoading;

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)');
    } finally {
      setLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <ScreenFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="speedometer-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.headerContent}>
                <Skeleton width={180} height={32} style={styles.titleSkeleton} />
                <Skeleton width={240} height={20} />
              </View>
            </View>
            <View style={styles.metricsGrid}>
              <Skeleton width="100%" height={120} style={styles.metricCardSkeleton} />
              <Skeleton width="100%" height={120} style={styles.metricCardSkeleton} />
              <Skeleton width="100%" height={120} style={styles.metricCardSkeleton} />
              <Skeleton width="100%" height={120} style={styles.metricCardSkeleton} />
            </View>
            <SkeletonList count={3} />
          </View>
        }
      />
    );
  }

  return (
    <ScreenFlatList
      data={[]}
      renderItem={() => null}
      ListHeaderComponent={
        <View>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="speedometer-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>Quick overview of your business</Text>
            </View>
            <Pressable
              onPress={handleLogout}
              disabled={loggingOut}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
              accessibilityLabel="Log out"
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Ionicons name="log-out-outline" size={24} color={colors.error} />
              )}
            </Pressable>
          </View>

          {/* Key Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Performance</Text>
            <View style={styles.metricsGrid}>
              <Card variant="elevated" style={styles.metricCard}>
                <View style={styles.metricIconContainer}>
                  <Ionicons name="cash-outline" size={24} color={colors.success} />
                </View>
                <Text style={styles.metricLabel}>Sales</Text>
                <Text style={styles.metricValue}>{formatMoney(todayTotals.sales)}</Text>
              </Card>

              <Card variant="elevated" style={styles.metricCard}>
                <View style={[styles.metricIconContainer, styles.profitIconContainer]}>
                  <Ionicons name="trending-up-outline" size={24} color={colors.success} />
                </View>
                <Text style={styles.metricLabel}>Profit</Text>
                <Text style={[styles.metricValue, styles.profitValue]}>
                  {formatMoney(todayProfit)}
                </Text>
              </Card>

              <Card variant="elevated" style={styles.metricCard}>
                <View style={[styles.metricIconContainer, styles.creditIconContainer]}>
                  <Ionicons name="card-outline" size={24} color={colors.warning} />
                </View>
                <Text style={styles.metricLabel}>Outstanding</Text>
                <Text style={styles.metricValue}>{formatMoney(totalOutstanding)}</Text>
              </Card>

              <Card variant="elevated" style={styles.metricCard}>
                <View style={[styles.metricIconContainer, styles.inventoryIconContainer]}>
                  <Ionicons name="cube-outline" size={24} color={colors.primary} />
                </View>
                <Text style={styles.metricLabel}>Total Stock</Text>
                <Text style={styles.metricValue}>{totalInventory}</Text>
              </Card>
            </View>
          </View>

          {/* Inventory Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Inventory Overview</Text>
              <Pressable onPress={() => router.push('/inventory')}>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>
            <Card variant="elevated" style={styles.inventoryCard}>
              <View style={styles.inventoryStats}>
                <View style={styles.inventoryStat}>
                  <View style={[styles.inventoryBadge, styles.fullBadge]}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  </View>
                  <View style={styles.inventoryStatContent}>
                    <Text style={styles.inventoryStatValue}>{totalFull}</Text>
                    <Text style={styles.inventoryStatLabel}>Full</Text>
                  </View>
                </View>
                <View style={styles.inventoryStat}>
                  <View style={[styles.inventoryBadge, styles.emptyBadge]}>
                    <Ionicons name="remove-circle" size={16} color={colors.warning} />
                  </View>
                  <View style={styles.inventoryStatContent}>
                    <Text style={styles.inventoryStatValue}>{totalEmpty}</Text>
                    <Text style={styles.inventoryStatLabel}>Empty</Text>
                  </View>
                </View>
                <View style={styles.inventoryStat}>
                  <View style={[styles.inventoryBadge, styles.damagedBadge]}>
                    <Ionicons name="close-circle" size={16} color={colors.error} />
                  </View>
                  <View style={styles.inventoryStatContent}>
                    <Text style={styles.inventoryStatValue}>{totalDamaged}</Text>
                    <Text style={styles.inventoryStatLabel}>Damaged</Text>
                  </View>
                </View>
              </View>
              {inventory.length > 0 && (
                <View style={styles.inventoryBreakdown}>
                  {inventory.slice(0, 3).map((inv) => {
                    const cylinderType = cylinderTypes.find((ct) => ct.id === inv.cylinderTypeId);
                    const total = inv.full + inv.empty + inv.damaged;
                    return (
                      <View key={inv.id} style={styles.inventoryItem}>
                        <Text style={styles.inventoryItemLabel} numberOfLines={1}>
                          {cylinderType?.label ?? 'Unknown'}
                        </Text>
                        <Text style={styles.inventoryItemValue}>{total}</Text>
                      </View>
                    );
                  })}
                  {inventory.length > 3 && (
                    <Text style={styles.inventoryMore}>+{inventory.length - 3} more</Text>
                  )}
                </View>
              )}
            </Card>
          </View>

          {/* Quick Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.quickStatsGrid}>
              <View style={styles.quickStatSlot}>
                <Card variant="default" style={styles.quickStatCard}>
                  <Ionicons name="people-outline" size={20} color={colors.primary} />
                  <Text style={styles.quickStatValue}>{customers.length}</Text>
                  <Text style={styles.quickStatLabel}>Customers</Text>
                </Card>
              </View>
              <Pressable style={styles.quickStatSlot} onPress={() => router.push('/(tabs)/owed')}>
                <Card variant="default" style={styles.quickStatCard}>
                  <Ionicons name="return-down-back-outline" size={20} color={colors.warning} />
                  <Text style={styles.quickStatValue}>{totalOwed}</Text>
                  <Text style={styles.quickStatLabel}>Owed Cylinders</Text>
                </Card>
              </Pressable>
              <View style={styles.quickStatSlot}>
                <Card variant="default" style={styles.quickStatCard}>
                  <Ionicons name="layers-outline" size={20} color={colors.primary} />
                  <Text style={styles.quickStatValue}>{inventory.length}</Text>
                  <Text style={styles.quickStatLabel}>Cylinder Types</Text>
                </Card>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <Pressable
                style={styles.quickAction}
                onPress={() => router.push('/ledger')}
              >
                <Card variant="default" style={styles.quickActionCard}>
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.quickActionLabel}>Record Movement</Text>
                </Card>
              </Pressable>
              <Pressable
                style={styles.quickAction}
                onPress={() => router.push('/customers')}
              >
                <Card variant="default" style={styles.quickActionCard}>
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="people-outline" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.quickActionLabel}>View Customers</Text>
                </Card>
              </Pressable>
              <Pressable
                style={styles.quickAction}
                onPress={() => router.push('/finance')}
              >
                <Card variant="default" style={styles.quickActionCard}>
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="wallet" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.quickActionLabel}>Finance</Text>
                </Card>
              </Pressable>
              <Pressable
                style={styles.quickAction}
                onPress={() => router.push('/history')}
              >
                <Card variant="default" style={styles.quickActionCard}>
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="time" size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.quickActionLabel}>History</Text>
                </Card>
              </Pressable>
            </View>
          </View>
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
    minWidth: 0,
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  logoutButtonPressed: {
    opacity: 0.7,
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
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  viewAll: {
    ...typography.smallSemibold,
    color: colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    padding: spacing.md,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  profitIconContainer: {
    backgroundColor: colors.success + '15',
  },
  creditIconContainer: {
    backgroundColor: colors.warning + '15',
  },
  inventoryIconContainer: {
    backgroundColor: colors.primary + '15',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metricValue: {
    ...typography.h4,
    color: colors.text,
  },
  profitValue: {
    color: colors.success,
  },
  inventoryCard: {
    padding: spacing.md,
  },
  inventoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  inventoryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inventoryBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullBadge: {
    backgroundColor: colors.success + '15',
  },
  emptyBadge: {
    backgroundColor: colors.warning + '15',
  },
  damagedBadge: {
    backgroundColor: colors.error + '15',
  },
  inventoryStatContent: {
    alignItems: 'flex-start',
  },
  inventoryStatValue: {
    ...typography.h4,
    color: colors.text,
  },
  inventoryStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inventoryBreakdown: {
    gap: spacing.sm,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventoryItemLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  inventoryItemValue: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  inventoryMore: {
    ...typography.small,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickStatSlot: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 96,
  },
  quickStatCard: {
    width: '100%',
    height: '100%',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatValue: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  quickStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    minWidth: '47%',
  },
  quickActionCard: {
    padding: spacing.md,
    alignItems: 'center',
  },
  quickActionIcon: {
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    ...typography.bodyMedium,
    color: colors.text,
    textAlign: 'center',
  },
  titleSkeleton: {
    marginBottom: spacing.xs,
  },
  metricCardSkeleton: {
    marginBottom: spacing.md,
  },
});
