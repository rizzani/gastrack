import { Screen, Card, Text } from '@/components/ui';

export default function InventoryScreen() {
  return (
    <Screen title="Inventory" subtitle="Full / Empty / Damaged by size">
      <Card title="Stock by size">
        <Text variant="body" muted>
          Placeholder for live stock by size and state.
        </Text>
      </Card>
    </Screen>
  );
}
