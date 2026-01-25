import { Screen, Card, Text, Button } from '@/components/ui';
import { spacing } from '@/constants/theme';

export default function DashboardScreen() {
  return (
    <Screen title="Dashboard" subtitle="Quick stock + owed summary">
      <Card title="Overview" style={{ marginBottom: spacing.xl }}>
        <Text variant="body" muted>
          Placeholder for stock + owed summary.
        </Text>
      </Card>
      <Button label="View inventory" onPress={() => {}} variant="primary" />
    </Screen>
  );
}
