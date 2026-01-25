import { View, Text, StyleSheet } from 'react-native';

export default function LedgerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ledger</Text>
      <Text style={styles.subtitle}>Record Swap, Loan, Return, Restock</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666' },
});
