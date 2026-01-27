import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenFlatList } from '@/components/ui/ScreenFlatList';
import { Button } from '@/components/ui/Button';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { ErrorWithRetry } from '@/components/ui/ErrorWithRetry';
import { useCustomers } from '@/hooks/useCustomers';
import { useOwed } from '@/hooks/useOwed';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { Customer, MovementType } from '@/lib/types';

export default function CustomersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectMode?: string; movementType?: MovementType }>();
  const isSelectMode = params.selectMode === 'true';
  const movementType = params.movementType;
  const { customers, isLoading, isError, error, refetch } = useCustomers();
  const { list: owedRecords, isLoading: isLoadingOwed } = useOwed();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter customers based on movement type
  const availableCustomers = useMemo(() => {
    if (movementType === 'return' && !isLoadingOwed) {
      // For returns, only show customers who have outstanding loans
      const customerIdsWithLoans = new Set(owedRecords.map((r) => r.customerId));
      return customers.filter((c) => customerIdsWithLoans.has(c.id));
    }
    // For swap and loan, show all customers
    return customers;
  }, [customers, movementType, owedRecords, isLoadingOwed]);

  const filteredCustomers = availableCustomers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || isLoadingOwed) {
    return (
      <ScreenFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Skeleton width={180} height={32} style={styles.titleSkeleton} />
              <Skeleton width={70} height={36} />
            </View>
            <Skeleton width="100%" height={44} style={styles.searchSkeleton} />
            <SkeletonList count={5} />
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
            message={error?.message ?? 'Error loading customers.'}
            onRetry={() => refetch()}
          />
        }
      />
    );
  }

  return (
    <ScreenFlatList<Customer>
      data={filteredCustomers}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CustomerCard
          customer={item}
          onPress={() => {
            if (isSelectMode) {
              // Navigate back to ledger with selected customer ID and preserve movement type
              const params: Record<string, string> = { selectedCustomerId: item.id };
              if (movementType) {
                params.movementType = movementType;
              }
              router.navigate({
                pathname: '/(tabs)/ledger',
                params,
              });
            } else {
              router.push(`/customers/${item.id}`);
            }
          }}
        />
      )}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Ionicons name="people-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>
                  {isSelectMode ? 'Select Customer' : 'Customers'}
                </Text>
                {!isSelectMode && (
                  <Text style={styles.subtitle}>
                    {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
                  </Text>
                )}
              </View>
            </View>
            {!isSelectMode && (
              <Button
                title="+ New"
                size="sm"
                onPress={() => {
                  router.push('/customers/new');
                }}
                style={styles.newButton}
              />
            )}
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons 
              name={searchQuery ? "search-outline" : movementType === 'return' ? "checkmark-circle-outline" : "people-outline"} 
              size={64} 
              color={colors.textTertiary} 
            />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery
              ? 'No customers found'
              : movementType === 'return'
                ? 'No outstanding loans'
                : 'No customers yet'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Try a different search term'
              : movementType === 'return'
                ? 'All customers have returned their cylinders'
                : 'Add your first customer to get started'}
          </Text>
          {!searchQuery && movementType !== 'return' && !isSelectMode && (
            <Button
              title="Add First Customer"
              onPress={() => {
                router.push('/customers/new');
              }}
              style={styles.emptyButton}
            />
          )}
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
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
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
  headerText: {
    flex: 1,
  },
  titleSkeleton: { flex: 1, marginRight: spacing.sm },
  searchSkeleton: { marginBottom: spacing.md },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  newButton: { minWidth: 80 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
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
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  emptyButton: { marginTop: spacing.xs },
});
