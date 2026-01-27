import { Screen } from '@/components/ui/Screen';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function NewCustomerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectMode?: string }>();
  const isSelectMode = params.selectMode === 'true';

  return (
    <Screen>
      <CustomerForm
        onSuccess={(customer) => {
          if (isSelectMode && customer) {
            // Navigate back to ledger with the newly created customer
            router.navigate({
              pathname: '/(tabs)/ledger',
              params: { selectedCustomerId: customer.id },
            });
          } else {
            router.back();
          }
        }}
      />
    </Screen>
  );
}
