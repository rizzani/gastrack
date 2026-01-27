import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { useCylinderTypes } from '@/hooks/useCylinderTypes';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { InventoryRecord } from '@/lib/types';

type StockRowProps = {
  inventory: InventoryRecord;
  onPress?: () => void;
};

export function StockRow({ inventory, onPress }: StockRowProps) {
  const { cylinderTypes } = useCylinderTypes();
  const total = inventory.full + inventory.empty + inventory.damaged;
  const fullPercentage = total > 0 ? Math.round((inventory.full / total) * 100) : 0;
  
  const cylinderType = cylinderTypes.find((ct) => ct.id === inventory.cylinderTypeId);

  return (
    <Pressable onPress={onPress}>
      <Card variant="default" style={styles.card}>
        <View style={styles.row}>
          {cylinderType?.img ? (
            <Image
              source={{ uri: cylinderType.img }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="cube-outline" size={24} color={colors.textTertiary} />
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.typeLabel}>
                  {cylinderType?.label ?? inventory.cylinderTypeId}
                </Text>
                <Text style={styles.totalText}>{total} total</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <View style={[styles.statBadge, styles.fullBadge]}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                </View>
                <Text style={styles.statValue}>{inventory.full}</Text>
                <Text style={styles.statLabel}>Full</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statBadge, styles.emptyBadge]}>
                  <Ionicons name="remove-circle" size={16} color={colors.warning} />
                </View>
                <Text style={styles.statValue}>{inventory.empty}</Text>
                <Text style={styles.statLabel}>Empty</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statBadge, styles.damagedBadge]}>
                  <Ionicons name="warning" size={16} color={colors.error} />
                </View>
                <Text style={styles.statValue}>{inventory.damaged}</Text>
                <Text style={styles.statLabel}>Damaged</Text>
              </View>
            </View>

            {total > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${fullPercentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{fullPercentage}% full</Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  typeLabel: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  totalText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  statBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
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
  statValue: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 6,
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
