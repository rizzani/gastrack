import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { Customer } from '@/lib/types';

type CustomerCardProps = {
  customer: Customer;
  onPress?: () => void;
};

export function CustomerCard({ customer, onPress }: CustomerCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card variant="default" style={styles.card}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{customer.name}</Text>
            {customer.phone && (
              <View style={styles.detailRow}>
                <Text style={styles.phone}>{customer.phone}</Text>
              </View>
            )}
            {customer.notes && (
              <Text style={styles.notes} numberOfLines={2}>{customer.notes}</Text>
            )}
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
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.bodySemibold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs / 2,
  },
  phone: {
    ...typography.small,
    color: colors.textSecondary,
  },
  notes: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
