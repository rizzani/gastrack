import { Screen, Card, Text } from '@/components/ui';

export default function OwedScreen() {
  return (
    <Screen title="Owed Empties" subtitle="Who owes what">
      <Card title="Owed list">
        <Text variant="body" muted>
          Placeholder for customers who haven’t returned cylinders.
        </Text>
      </Card>
    </Screen>
  );
}
