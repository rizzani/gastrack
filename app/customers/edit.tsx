import { Screen } from '@/components/ui/Screen';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCustomers } from '@/hooks/useCustomers';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorWithRetry } from '@/components/ui/ErrorWithRetry';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function EditCustomerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customers, isLoading, isError, error, refetch } = useCustomers();

  const customer = customers.find((c) => c.id === id);

  if (isLoading) {
    return (
      <Screen>
        <Skeleton width="100%" height={44} style={styles.skeleton} />
        <Skeleton width="100%" height={44} style={styles.skeleton} />
        <Skeleton width="100%" height={120} style={styles.skeleton} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorWithRetry
          message={error?.message ?? 'Error loading customer.'}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  if (!customer) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>Customer not found</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <CustomerForm
        initialData={{
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          notes: customer.notes,
        }}
        onSuccess={() => {
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.h4,
    color: colors.error,
  },
  skeleton: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
  },
});
