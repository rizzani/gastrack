import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenFlatList } from '@/components/ui/ScreenFlatList';
import { useResponsive } from '@/hooks/useResponsive';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ErrorWithRetry } from '@/components/ui/ErrorWithRetry';
import { useFinance, useSummaryTotals, type SummaryTotals } from '@/hooks/useFinance';
import { useCustomers } from '@/hooks/useCustomers';
import { usePrices } from '@/hooks/usePrices';
import { useCylinderTypes } from '@/hooks/useCylinderTypes';
import {
  todayRange,
  thisWeekRange,
  allTimeRange,
  thisMonthRange,
  monthRange,
} from '@/lib/dateUtils';
import { getRefillPriceStats } from '@/lib/refillPriceStats';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { CustomerBalance } from '@/lib/types';

function formatMoney(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  });
}

function profitFromTotals(t: SummaryTotals): number {
  return t.sales - t.refills - t.adds;
}

type SummaryCardProps = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  totals: SummaryTotals;
  loading: boolean;
  headerRight?: React.ReactNode;
};

function SummaryCard({ title, icon, totals, loading, headerRight }: SummaryCardProps) {
  const profit = profitFromTotals(totals);
  const profitNegative = profit < 0;
  return (
    <Card variant="elevated" style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryHeaderLeft}>
          <Ionicons name={icon} size={20} color={colors.primary} />
          <Text style={styles.summaryCardTitle}>{title}</Text>
        </View>
        {headerRight}
      </View>
      {loading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Sales</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.sales)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Payments</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.payments)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Refills</Text>
            <Text style={[styles.summaryValue, styles.expenseValue]}>{formatMoney(totals.refills)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Purchase cost</Text>
            <Text style={[styles.summaryValue, styles.expenseValue]}>{formatMoney(totals.adds)}</Text>
          </View>
          <View style={[styles.summaryItem, styles.profitItem]}>
            <Text style={styles.profitLabel}>Profit</Text>
            <Text
              style={[styles.profitValue, profitNegative && styles.profitValueNegative]}
            >
              {formatMoney(profit)}
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}

export default function FinanceScreen() {
  const router = useRouter();
  const { isCompact } = useResponsive();
  const { outstanding, outstandingLoading, outstandingError, outstandingErrorDetail, outstandingRefetch } = useFinance();
  const { customers } = useCustomers();
  const { cylinderTypes } = useCylinderTypes();
  const { getPriceHistory } = usePrices();

  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => todayRange(), []);
  const week = useMemo(() => thisWeekRange(), []);
  const allTime = useMemo(() => allTimeRange(), []);
  const thisMonth = useMemo(() => thisMonthRange(), []);

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const viewMonthRange = useMemo(() => monthRange(viewYear, viewMonth), [viewYear, viewMonth]);

  type CustomPeriod = 'month' | 'today' | 'week' | 'view_month';
  const [customPeriod, setCustomPeriod] = useState<CustomPeriod>('month');

  const { totals: todayTotals, isLoading: todayLoading } = useSummaryTotals(today);
  const { totals: weekTotals, isLoading: weekLoading } = useSummaryTotals(week);
  const { totals: overallTotals, isLoading: overallLoading } = useSummaryTotals(allTime);
  const { totals: monthTotals, isLoading: monthLoading } = useSummaryTotals(thisMonth);
  const { totals: viewMonthTotals, isLoading: viewMonthLoading } = useSummaryTotals(viewMonthRange);

  const customTotals = useMemo(() => {
    switch (customPeriod) {
      case 'month':
        return monthTotals;
      case 'today':
        return todayTotals;
      case 'week':
        return weekTotals;
      case 'view_month':
        return viewMonthTotals;
    }
  }, [customPeriod, monthTotals, todayTotals, weekTotals, viewMonthTotals]);

  const customLoading = useMemo(() => {
    switch (customPeriod) {
      case 'month':
        return monthLoading;
      case 'today':
        return todayLoading;
      case 'week':
        return weekLoading;
      case 'view_month':
        return viewMonthLoading;
    }
  }, [customPeriod, monthLoading, todayLoading, weekLoading, viewMonthLoading]);

  const customTitle = useMemo(() => {
    switch (customPeriod) {
      case 'month':
        return 'This month';
      case 'today':
        return 'Today';
      case 'week':
        return 'This week';
      case 'view_month':
        return formatMonthYear(viewYear, viewMonth);
    }
  }, [customPeriod, viewYear, viewMonth]);

  const customProfit = profitFromTotals(customTotals);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const refillStatsByType = useMemo(() => {
    const out: { cylinderTypeId: string; label: string; stats: ReturnType<typeof getRefillPriceStats> }[] = [];
    for (const c of cylinderTypes) {
      const h = getPriceHistory(c.id);
      if (h.length === 0) continue;
      out.push({ cylinderTypeId: c.id, label: c.label, stats: getRefillPriceStats(h) });
    }
    return out;
  }, [cylinderTypes, getPriceHistory]);

  const getCustomer = (customerId: string) => customers.find((c) => c.id === customerId);
  const totalOutstanding = outstanding.reduce((s, b) => s + b.balance, 0);

  if (outstandingLoading) {
    return (
      <ScreenFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Finance</Text>
            <Text style={styles.subtitle}>Cash, credit & refill prices</Text>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Outstanding (credit)</Text>
              <SkeletonList count={4} />
            </View>
          </View>
        }
      />
    );
  }

  if (outstandingError) {
    return (
      <ScreenFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Finance</Text>
            <Text style={styles.subtitle}>Cash, credit & refill prices</Text>
            <ErrorWithRetry
              message={outstandingErrorDetail instanceof Error ? outstandingErrorDetail.message : 'Error loading outstanding.'}
              onRetry={() => outstandingRefetch()}
            />
          </View>
        }
      />
    );
  }

  return (
    <ScreenFlatList<CustomerBalance>
      data={outstanding}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const customer = getCustomer(item.customerId);
        return (
          <Pressable onPress={() => router.push(`/customers/${item.customerId}`)}>
            <Card variant="default" style={styles.outstandingCard}>
              <View style={styles.outstandingRow}>
                <View style={styles.outstandingInfo}>
                  <Text style={styles.outstandingName}>{customer?.name ?? 'Unknown'}</Text>
                </View>
                <Text style={styles.outstandingAmount}>{formatMoney(item.balance)}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            </Card>
          </Pressable>
        );
      }}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={[styles.headerIcon, isCompact && styles.headerIconCompact]}>
              <Ionicons name="wallet-outline" size={isCompact ? 20 : 24} color={colors.primary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Finance</Text>
              <Text style={styles.subtitle}>Cash, credit & refill prices</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <SummaryCard
              title="Overall"
              icon="trending-up-outline"
              totals={overallTotals}
              loading={overallLoading}
            />
            <Card variant="elevated" style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryHeaderLeft}>
                  <Ionicons name="options-outline" size={20} color={colors.primary} />
                  <Text style={styles.summaryCardTitle}>Customize</Text>
                </View>
                {customPeriod === 'view_month' && (
                  <View style={styles.monthNav}>
                    <Pressable onPress={goPrevMonth} hitSlop={8} style={styles.monthNavBtn}>
                      <Ionicons name="chevron-back" size={22} color={colors.primary} />
                    </Pressable>
                    <Pressable onPress={goNextMonth} hitSlop={8} style={styles.monthNavBtn}>
                      <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                    </Pressable>
                  </View>
                )}
              </View>
              <View style={styles.periodChips}>
                {(['month', 'today', 'week', 'view_month'] as const).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setCustomPeriod(p)}
                    style={[styles.periodChip, customPeriod === p && styles.periodChipActive]}
                  >
                    <Text
                      style={[
                        styles.periodChipText,
                        customPeriod === p && styles.periodChipTextActive,
                      ]}
                    >
                      {p === 'month'
                        ? 'Month'
                        : p === 'today'
                          ? 'Today'
                          : p === 'week'
                            ? 'Week'
                            : 'View month'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {customPeriod === 'view_month' && (
                <Text style={styles.customizeSubtitle}>{customTitle}</Text>
              )}
              {customLoading ? (
                <Text style={styles.muted}>Loading…</Text>
              ) : (
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Sales</Text>
                    <Text style={styles.summaryValue}>{formatMoney(customTotals.sales)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Payments</Text>
                    <Text style={styles.summaryValue}>{formatMoney(customTotals.payments)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Refills</Text>
                    <Text style={[styles.summaryValue, styles.expenseValue]}>
                      {formatMoney(customTotals.refills)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Purchase cost</Text>
                    <Text style={[styles.summaryValue, styles.expenseValue]}>
                      {formatMoney(customTotals.adds)}
                    </Text>
                  </View>
                  <View style={[styles.summaryItem, styles.profitItem]}>
                    <Text style={styles.profitLabel}>Profit</Text>
                    <Text
                      style={[
                        styles.profitValue,
                        customProfit < 0 && styles.profitValueNegative,
                      ]}
                    >
                      {formatMoney(customProfit)}
                    </Text>
                  </View>
                </View>
              )}
            </Card>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outstanding Credit</Text>
            <Card variant="elevated" style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total outstanding</Text>
                <Text style={styles.totalAmount}>{formatMoney(totalOutstanding)}</Text>
              </View>
            </Card>
          </View>
          {outstanding.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Who owes money</Text>
            </View>
          )}
        </View>
      }
      ListFooterComponent={
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Refill Price Insights</Text>
          {refillStatsByType.length === 0 ? (
            <Card>
              <Text style={styles.placeholder}>No price history yet</Text>
            </Card>
          ) : (
            refillStatsByType.map(({ cylinderTypeId, label, stats }) => (
              <Card key={cylinderTypeId} style={styles.priceStatsCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.statsCylinderLabel}>{label}</Text>
                  {stats.daysSinceLastChange !== null && (
                    <View style={styles.lastUpdatedBadge}>
                      <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.lastUpdatedText}>
                        {stats.daysSinceLastChange === 0
                          ? 'Today'
                          : stats.daysSinceLastChange === 1
                            ? '1 day ago'
                            : `${stats.daysSinceLastChange}d ago`}
                      </Text>
                    </View>
                  )}
                </View>
                {stats.hasEnoughData ? (
                  <View style={styles.statsContainer}>
                    {/* Current Prices - Prominent Section */}
                    <View style={styles.currentPricesSection}>
                      <Text style={styles.sectionSubtitle}>Current Pricing</Text>
                      <View style={styles.currentPricesRow}>
                        <View style={styles.priceItem}>
                          <Text style={styles.priceLabel}>Sell Price</Text>
                          <Text style={styles.priceValue}>{formatMoney(stats.currentSellPrice)}</Text>
                        </View>
                        <View style={styles.priceItem}>
                          <Text style={styles.priceLabel}>Refill Cost</Text>
                          <Text style={[styles.priceValue, styles.costValue]}>
                            {formatMoney(stats.currentRefillCost)}
                          </Text>
                        </View>
                        <View style={styles.priceItem}>
                          <Text style={styles.priceLabel}>Profit Margin</Text>
                          <Text style={[styles.priceValue, styles.marginValue]}>
                            {formatMoney(stats.currentMargin)}
                          </Text>
                          <Text style={styles.marginPercent}>
                            {stats.currentMarginPercent.toFixed(1)}% margin
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Price Changes - Clear Section */}
                    {stats.sellPriceChange !== null && (
                      <View style={styles.changesSection}>
                        <Text style={styles.sectionSubtitle}>Price Changes (vs Previous)</Text>
                        <View style={styles.changesGrid}>
                          <View style={styles.changeItem}>
                            <View style={styles.changeHeader}>
                              <Text style={styles.changeLabel}>Sell Price</Text>
                              {stats.sellPriceChange !== 0 && (
                                <Ionicons
                                  name={stats.sellPriceChange > 0 ? 'arrow-up' : 'arrow-down'}
                                  size={16}
                                  color={
                                    stats.sellPriceChange > 0 ? colors.success : colors.error
                                  }
                                />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.changeValue,
                                stats.sellPriceChange > 0
                                  ? styles.changePositive
                                  : stats.sellPriceChange < 0
                                    ? styles.changeNegative
                                    : styles.changeNeutral,
                              ]}
                            >
                              {stats.sellPriceChange > 0 ? '+' : ''}
                              {formatMoney(stats.sellPriceChange)}
                            </Text>
                            {stats.sellPriceChangePercent !== null && (
                              <Text style={styles.changePercent}>
                                {stats.sellPriceChangePercent > 0 ? '+' : ''}
                                {stats.sellPriceChangePercent.toFixed(1)}%
                              </Text>
                            )}
                          </View>

                          {stats.refillCostChange !== null && (
                            <View style={styles.changeItem}>
                              <View style={styles.changeHeader}>
                                <Text style={styles.changeLabel}>Refill Cost</Text>
                                {stats.refillCostChange !== 0 && (
                                  <Ionicons
                                    name={stats.refillCostChange > 0 ? 'arrow-up' : 'arrow-down'}
                                    size={16}
                                    color={
                                      stats.refillCostChange > 0 ? colors.error : colors.success
                                    }
                                  />
                                )}
                              </View>
                              <Text
                                style={[
                                  styles.changeValue,
                                  stats.refillCostChange > 0
                                    ? styles.changeNegative
                                    : stats.refillCostChange < 0
                                      ? styles.changePositive
                                      : styles.changeNeutral,
                                ]}
                              >
                                {stats.refillCostChange > 0 ? '+' : ''}
                                {formatMoney(stats.refillCostChange)}
                              </Text>
                              {stats.refillCostChangePercent !== null && (
                                <Text style={styles.changePercent}>
                                  {stats.refillCostChangePercent > 0 ? '+' : ''}
                                  {stats.refillCostChangePercent.toFixed(1)}%
                                </Text>
                              )}
                            </View>
                          )}

                          {stats.marginChange !== null && (
                            <View style={styles.changeItem}>
                              <View style={styles.changeHeader}>
                                <Text style={styles.changeLabel}>Profit Margin</Text>
                                {stats.marginChange !== 0 && (
                                  <Ionicons
                                    name={stats.marginChange > 0 ? 'arrow-up' : 'arrow-down'}
                                    size={16}
                                    color={
                                      stats.marginChange > 0 ? colors.success : colors.error
                                    }
                                  />
                                )}
                              </View>
                              <Text
                                style={[
                                  styles.changeValue,
                                  stats.marginChange > 0
                                    ? styles.changePositive
                                    : stats.marginChange < 0
                                      ? styles.changeNegative
                                      : styles.changeNeutral,
                                ]}
                              >
                                {stats.marginChange > 0 ? '+' : ''}
                                {formatMoney(stats.marginChange)}
                              </Text>
                              {stats.marginChangePercent !== null && (
                                <Text style={styles.changePercent}>
                                  {stats.marginChangePercent > 0 ? '+' : ''}
                                  {stats.marginChangePercent.toFixed(1)}%
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Trends Section */}
                    {stats.sellPriceTrend && (
                      <View style={styles.trendsSection}>
                        <Text style={styles.sectionSubtitle}>Trends</Text>
                        <View style={styles.trendsRow}>
                          {stats.sellPriceTrend && (
                            <View style={styles.trendItem}>
                              <Text style={styles.trendLabel}>Sell Price</Text>
                              <View style={styles.trendBadge}>
                                <Ionicons
                                  name={
                                    stats.sellPriceTrend === 'increasing'
                                      ? 'trending-up'
                                      : stats.sellPriceTrend === 'decreasing'
                                        ? 'trending-down'
                                        : 'remove'
                                  }
                                  size={14}
                                  color={
                                    stats.sellPriceTrend === 'increasing'
                                      ? colors.success
                                      : stats.sellPriceTrend === 'decreasing'
                                        ? colors.error
                                        : colors.textSecondary
                                  }
                                />
                                <Text
                                  style={[
                                    styles.trendText,
                                    stats.sellPriceTrend === 'increasing'
                                      ? styles.trendUp
                                      : stats.sellPriceTrend === 'decreasing'
                                        ? styles.trendDown
                                        : styles.trendStable,
                                  ]}
                                >
                                  {stats.sellPriceTrend === 'increasing'
                                    ? 'Increasing'
                                    : stats.sellPriceTrend === 'decreasing'
                                      ? 'Decreasing'
                                      : 'Stable'}
                                </Text>
                              </View>
                            </View>
                          )}
                          {stats.refillCostTrend && (
                            <View style={styles.trendItem}>
                              <Text style={styles.trendLabel}>Refill Cost</Text>
                              <View style={styles.trendBadge}>
                                <Ionicons
                                  name={
                                    stats.refillCostTrend === 'increasing'
                                      ? 'trending-up'
                                      : stats.refillCostTrend === 'decreasing'
                                        ? 'trending-down'
                                        : 'remove'
                                  }
                                  size={14}
                                  color={
                                    stats.refillCostTrend === 'increasing'
                                      ? colors.error
                                      : stats.refillCostTrend === 'decreasing'
                                        ? colors.success
                                        : colors.textSecondary
                                  }
                                />
                                <Text
                                  style={[
                                    styles.trendText,
                                    stats.refillCostTrend === 'increasing'
                                      ? styles.trendDown
                                      : stats.refillCostTrend === 'decreasing'
                                        ? styles.trendUp
                                        : styles.trendStable,
                                  ]}
                                >
                                  {stats.refillCostTrend === 'increasing'
                                    ? 'Increasing'
                                    : stats.refillCostTrend === 'decreasing'
                                      ? 'Decreasing'
                                      : 'Stable'}
                                </Text>
                              </View>
                            </View>
                          )}
                          {stats.marginTrend && (
                            <View style={styles.trendItem}>
                              <Text style={styles.trendLabel}>Margin</Text>
                              <View style={styles.trendBadge}>
                                <Ionicons
                                  name={
                                    stats.marginTrend === 'increasing'
                                      ? 'trending-up'
                                      : stats.marginTrend === 'decreasing'
                                        ? 'trending-down'
                                        : 'remove'
                                  }
                                  size={14}
                                  color={
                                    stats.marginTrend === 'increasing'
                                      ? colors.success
                                      : stats.marginTrend === 'decreasing'
                                        ? colors.error
                                        : colors.textSecondary
                                  }
                                />
                                <Text
                                  style={[
                                    styles.trendText,
                                    stats.marginTrend === 'increasing'
                                      ? styles.trendUp
                                      : stats.marginTrend === 'decreasing'
                                        ? styles.trendDown
                                        : styles.trendStable,
                                  ]}
                                >
                                  {stats.marginTrend === 'increasing'
                                    ? 'Improving'
                                    : stats.marginTrend === 'decreasing'
                                      ? 'Declining'
                                      : 'Stable'}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* History Summary */}
                    {stats.totalChanges > 1 && (
                      <View style={styles.historySection}>
                        <View style={styles.historyItem}>
                          <Ionicons name="stats-chart-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.historyText}>
                            {stats.totalChanges} price change{stats.totalChanges !== 1 ? 's' : ''} total
                            {stats.changesLast30Days > 0 && ` • ${stats.changesLast30Days} in last 30 days`}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.muted}>Not enough data</Text>
                )}
              </Card>
            ))
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No outstanding credit</Text>
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
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryCardTitle: {
    ...typography.h4,
    color: colors.text,
  },
  summaryGrid: {
    gap: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  expenseValue: {
    color: colors.error,
  },
  profitItem: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  profitLabel: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  profitValue: {
    ...typography.h4,
    color: colors.success,
  },
  profitValueNegative: {
    color: colors.error,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  monthNavBtn: {
    padding: spacing.xs,
  },
  periodChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  periodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
  },
  periodChipActive: {
    backgroundColor: colors.gray200,
  },
  periodChipText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  periodChipTextActive: {
    color: colors.primary,
    ...typography.smallSemibold,
  },
  customizeSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  totalCard: {
    marginBottom: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  totalAmount: {
    ...typography.h3,
    color: colors.text,
  },
  outstandingCard: {
    marginVertical: spacing.sm,
  },
  outstandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  outstandingInfo: {
    flex: 1,
  },
  outstandingName: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  outstandingAmount: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  muted: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  placeholder: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  priceStatsCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsCylinderLabel: {
    ...typography.h4,
    color: colors.text,
  },
  lastUpdatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
  },
  lastUpdatedText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  statsContainer: {
    gap: spacing.lg,
  },
  sectionSubtitle: {
    ...typography.bodySemibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  currentPricesSection: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  currentPricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  priceValue: {
    ...typography.bodySemibold,
    color: colors.text,
    fontSize: 18,
  },
  costValue: {
    color: colors.error,
  },
  marginValue: {
    color: colors.success,
  },
  marginPercent: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  changesSection: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  changesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  changeItem: {
    flex: 1,
    minWidth: '45%',
  },
  changeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    marginBottom: spacing.xs,
  },
  changeLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  changeValue: {
    ...typography.bodySemibold,
    fontSize: 16,
  },
  changePercent: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  changePositive: {
    color: colors.success,
  },
  changeNegative: {
    color: colors.error,
  },
  changeNeutral: {
    color: colors.textSecondary,
  },
  trendsSection: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  trendsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  trendItem: {
    flex: 1,
    minWidth: '30%',
  },
  trendLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  trendText: {
    ...typography.small,
    fontWeight: '600',
  },
  trendUp: {
    color: colors.success,
  },
  trendDown: {
    color: colors.error,
  },
  trendStable: {
    color: colors.textSecondary,
  },
  historySection: {
    paddingTop: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  historyText: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
