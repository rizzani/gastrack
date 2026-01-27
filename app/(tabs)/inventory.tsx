import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenFlatList } from '@/components/ui/ScreenFlatList';
import { StockRow } from '@/components/inventory/StockRow';
import { StockSummary } from '@/components/inventory/StockSummary';
import { Button } from '@/components/ui/Button';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { ErrorWithRetry } from '@/components/ui/ErrorWithRetry';
import { useInventory } from '@/hooks/useInventory';
import { useCylinderTypes } from '@/hooks/useCylinderTypes';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { InventoryRecord } from '@/lib/types';

export default function InventoryScreen() {
  const router = useRouter();
  const { list, isLoading, isError, error, refetch } = useInventory();
  const { cylinderTypes } = useCylinderTypes();

  // Get cylinder types that don't have inventory yet
  const existingCylinderTypeIds = new Set(list.map((inv) => inv.cylinderTypeId));
  const missingCylinderTypes = cylinderTypes.filter((ct) => !existingCylinderTypeIds.has(ct.id));

  const totalStock = list.reduce(
    (acc, inv) => acc + inv.full + inv.empty + inv.damaged,
    0
  );

  if (isLoading) {
    return (
      <ScreenFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            <Skeleton width={180} height={32} style={styles.titleSkeleton} />
            <SkeletonList count={3} />
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
          <ErrorWithRetry
            message={error?.message ?? 'Error loading inventory.'}
            onRetry={() => refetch()}
          />
        }
      />
    );
  }

  return (
    <ScreenFlatList<InventoryRecord>
      data={list}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <StockRow inventory={item} onPress={() => router.push(`/inventory/${item.id}`)} />
      )}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>Inventory</Text>
                <Text style={styles.headerSubtitle}>
                  {list.length} {list.length === 1 ? 'type' : 'types'} • {totalStock} total cylinders
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push('/inventory/new')}
            >
              <Ionicons name="add" size={24} color={colors.surface} />
            </Pressable>
          </View>

          {list.length > 0 && (
            <View style={styles.summaryContainer}>
              <StockSummary inventory={list} />
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cube-outline" size={48} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Inventory Yet</Text>
          <Text style={styles.emptyText}>
            Start tracking your gas cylinder inventory by adding your first stock
          </Text>
          <Button
            title="Add Inventory"
            onPress={() => router.push('/inventory/new')}
            style={styles.emptyButton}
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  summaryContainer: {
    marginBottom: spacing.md,
  },
  titleSkeleton: {
    marginBottom: spacing.md,
  },
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  emptyButton: {
    minWidth: 200,
  },
});
