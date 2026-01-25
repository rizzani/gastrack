import { View, Text, StyleSheet } from 'react-native';

export default function CustomersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Directory</Text>
      <Text style={styles.subtitle}>List of buyers</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666' },
});
