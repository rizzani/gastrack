import { TextInput, Text, View, StyleSheet, type TextInputProps } from 'react-native';
import { colors, typography, borderRadius, spacing } from '@/constants/theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Input({ label, error, helperText, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input, 
          error && styles.inputError,
          props.multiline && styles.inputMultiline,
          style
        ]}
        placeholderTextColor={colors.textTertiary}
        {...props}
      />
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  label: {
    ...typography.smallSemibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: spacing.sm + 2,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.error,
  },
});
