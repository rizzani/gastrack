import { Screen, Card, Text } from '@/components/ui';

export default function HistoryScreen() {
  return (
    <Screen title="History" subtitle="Movement timeline">
      <Card title="Activity log">
        <Text variant="body" muted>
          Placeholder for sales, returns, and adjustments.
        </Text>
      </Card>
    </Screen>
  );
}
