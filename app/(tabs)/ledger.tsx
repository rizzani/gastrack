import { Screen, Card, Input } from '@/components/ui';

export default function LedgerScreen() {
  return (
    <Screen title="Ledger" subtitle="Record Swap, Loan, Return, Restock">
      <Card title="Record movement">
        <Input label="Quantity" placeholder="0" />
      </Card>
    </Screen>
  );
}
