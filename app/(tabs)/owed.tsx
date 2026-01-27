import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenFlatList } from '@/components/ui/ScreenFlatList';
import { OwedRow } from '@/components/owed/OwedRow';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ErrorWithRetry } from '@/components/ui/ErrorWithRetry';
import { useOwed } from '@/hooks/useOwed';
import { useCustomers } from '@/hooks/useCustomers';
import { colors, typography, spacing } from '@/constants/theme';
import type { OwedRecord } from '@/lib/types';

export default function OwedScreen() {
  const router = useRouter();
  const { list: owedList, isLoading, isError, error, refetch } = useOwed();
  const { customers } = useCustomers();

  const getCustomer = (customerId: string) =>
    customers.find((c) => c.id === customerId);

  const totalOwed = owedList.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <ScreenFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Outstanding Loans</Text>
            <Text style={styles.subtitle}>Who owes what</Text>
            <SkeletonList count={4} />
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
            <Text style={styles.title}>Outstanding Loans</Text>
            <ErrorWithRetry
              message={error?.message ?? 'Error loading owed list.'}
              onRetry={() => refetch()}
            />
          </View>
        }
      />
    );
  }

  return (
    <ScreenFlatList<OwedRecord>
      data={owedList}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <OwedRow
          owed={item}
          customer={getCustomer(item.customerId)}
          onPress={() => router.push(`/customers/${item.customerId}`)}
        />
      )}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="time-outline" size={24} color={colors.warning} />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Outstanding Loans</Text>
              <Text style={styles.subtitle}>
                {owedList.length === 0 
                  ? 'All cylinders accounted for'
                  : `${totalOwed} ${totalOwed === 1 ? 'cylinder' : 'cylinders'} owed by ${owedList.length} ${owedList.length === 1 ? 'customer' : 'customers'}`}
              </Text>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
          </View>
          <Text style={styles.emptyTitle}>All Clear</Text>
          <Text style={styles.emptyText}>No customers owe cylinders</Text>
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
    borderRadius: 12,
    backgroundColor: colors.warning + '15',
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
});
