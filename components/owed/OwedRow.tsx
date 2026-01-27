import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { useCylinderTypes } from '@/hooks/useCylinderTypes';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { OwedRecord, Customer } from '@/lib/types';

type OwedRowProps = {
  owed: OwedRecord;
  customer?: Customer | null;
  onPress?: () => void;
};

export function OwedRow({ owed, customer, onPress }: OwedRowProps) {
  const { cylinderTypes } = useCylinderTypes();
  const cylinderType = cylinderTypes.find((ct) => ct.id === owed.cylinderTypeId);

  return (
    <Pressable onPress={onPress}>
      <Card variant="default" style={styles.card}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.warning + '15' }]}>
            <Ionicons name="time-outline" size={24} color={colors.warning} />
          </View>
          <View style={styles.info}>
            <Text style={styles.customerName}>{customer?.name ?? 'Unknown Customer'}</Text>
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>
                  {cylinderType?.label ?? owed.cylinderTypeId}
                </Text>
              </View>
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>{owed.quantity}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  customerName: {
    ...typography.bodySemibold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs / 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  detailText: {
    ...typography.small,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  quantityBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  quantityText: {
    ...typography.smallSemibold,
    color: colors.warning,
  },
});
