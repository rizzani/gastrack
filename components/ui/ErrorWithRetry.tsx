import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

type ErrorWithRetryProps = {
  message?: string;
  onRetry: () => void;
};

export function ErrorWithRetry({ message = 'Something went wrong.', onRetry }: ErrorWithRetryProps) {
  return (
    <View style={styles.center}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
      </View>
      <Text style={styles.title}>Error</Text>
      <Text style={styles.message}>{message}</Text>
      <Button
        title="Try Again"
        onPress={onRetry}
        style={styles.retryButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  retryButton: {
    minWidth: 160,
  },
});
