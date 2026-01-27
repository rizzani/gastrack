import { useRef } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { MovementForm, type MovementFormRef } from '@/components/movements/MovementForm';
import { colors, typography, spacing } from '@/constants/theme';

export default function LedgerScreen() {
  const formRef = useRef<MovementFormRef>(null);

  const handleReset = () => {
    formRef.current?.reset();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Record Movement</Text>
            <Text style={styles.subtitle}>Swap, Loan, Return, or Restock</Text>
          </View>
          <Pressable onPress={handleReset} style={styles.resetButton}>
            <Ionicons name="refresh-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </View>
      <MovementForm ref={formRef} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  resetButton: {
    padding: spacing.xs,
    marginTop: spacing.xs / 2,
  },
});
