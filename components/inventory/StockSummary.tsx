import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { InventoryRecord } from '@/lib/types';

type StockSummaryProps = {
  inventory: InventoryRecord[];
};

export function StockSummary({ inventory }: StockSummaryProps) {
  const { isCompact, isVeryCompact } = useResponsive();
  const totals = inventory.reduce(
    (acc, inv) => ({
      full: acc.full + inv.full,
      empty: acc.empty + inv.empty,
      damaged: acc.damaged + inv.damaged,
    }),
    { full: 0, empty: 0, damaged: 0 }
  );

  const totalStock = totals.full + totals.empty + totals.damaged;
  const fullPercentage = totalStock > 0 ? Math.round((totals.full / totalStock) * 100) : 0;
  
  const getProgressText = () => {
    if (fullPercentage === 0) {
      return 'Stock is empty or damaged';
    }
    if (fullPercentage === 100) {
      return 'All stock is full';
    }
    return `${fullPercentage}% of stock is full`;
  };

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock Overview</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{totalStock}</Text>
        </View>
      </View>
      <View style={[styles.counts, isCompact && styles.countsCompact]}>
        <View style={[styles.countItem, styles.fullItem, isCompact && styles.countItemCompact, isVeryCompact && styles.countItemVeryCompact]}>
          <View style={[styles.countIcon, styles.fullIcon, isCompact && styles.countIconCompact]}>
            <Ionicons name="checkmark-circle" size={isCompact ? 20 : 24} color={colors.surface} />
          </View>
          <View style={styles.countContent}>
            <Text style={[styles.countValue, styles.fullCount]}>{totals.full}</Text>
            <Text style={styles.countLabel}>Full</Text>
          </View>
        </View>
        <View style={[styles.countItem, styles.emptyItem, isCompact && styles.countItemCompact, isVeryCompact && styles.countItemVeryCompact]}>
          <View style={[styles.countIcon, styles.emptyIcon, isCompact && styles.countIconCompact]}>
            <Ionicons name="remove-circle" size={isCompact ? 20 : 24} color={colors.surface} />
          </View>
          <View style={styles.countContent}>
            <Text style={[styles.countValue, styles.emptyCount]}>{totals.empty}</Text>
            <Text style={styles.countLabel}>Empty</Text>
          </View>
        </View>
        <View style={[styles.countItem, styles.damagedItem, isCompact && styles.countItemCompact, isVeryCompact && styles.countItemVeryCompact]}>
          <View style={[styles.countIcon, styles.damagedIcon, isCompact && styles.countIconCompact]}>
            <Ionicons name="warning" size={isCompact ? 20 : 24} color={colors.surface} />
          </View>
          <View style={styles.countContent}>
            <Text style={[styles.countValue, styles.damagedCount]}>{totals.damaged}</Text>
            <Text style={styles.countLabel}>Damaged</Text>
          </View>
        </View>
      </View>
      {totalStock > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${fullPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {getProgressText()}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h4,
    color: colors.text,
  },
  totalBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
  },
  totalBadgeText: {
    ...typography.smallSemibold,
    color: colors.surface,
  },
  counts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  countsCompact: {
    gap: spacing.sm,
  },
  countItem: {
    flex: 1,
    minWidth: 72,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
    marginHorizontal: spacing.xs,
  },
  countItemCompact: {
    padding: spacing.sm,
    marginHorizontal: 0,
  },
  countItemVeryCompact: {
    minWidth: 56,
  },
  fullItem: {
    backgroundColor: colors.success + '10',
  },
  emptyItem: {
    backgroundColor: colors.warning + '10',
  },
  damagedItem: {
    backgroundColor: colors.error + '10',
  },
  countIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  countIconCompact: {
    width: 36,
    height: 36,
    marginBottom: spacing.xs,
  },
  fullIcon: {
    backgroundColor: colors.success,
  },
  emptyIcon: {
    backgroundColor: colors.warning,
  },
  damagedIcon: {
    backgroundColor: colors.error,
  },
  countContent: {
    alignItems: 'center',
  },
  countValue: {
    ...typography.h2,
    marginBottom: spacing.xs / 2,
  },
  fullCount: {
    color: colors.success,
  },
  emptyCount: {
    color: colors.warning,
  },
  damagedCount: {
    color: colors.error,
  },
  countLabel: {
    ...typography.captionSemibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
  },
  progressText: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
