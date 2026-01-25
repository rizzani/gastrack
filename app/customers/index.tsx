import { Screen, Card, Text, Button } from '@/components/ui';
import { spacing } from '@/constants/theme';

export default function CustomersScreen() {
  return (
    <Screen title="Customer Directory" subtitle="List of buyers">
      <Card title="Customers" style={{ marginBottom: spacing.xl }}>
        <Text variant="body" muted>
          Placeholder for customer list.
        </Text>
      </Card>
      <Button label="Add customer" onPress={() => {}} variant="secondary" />
    </Screen>
  );
}
