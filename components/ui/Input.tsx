import { View, TextInput, TextInputProps, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, radii, spacing } from '@/constants/theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextInputProps['style'];
}

export function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  placeholderTextColor = colors.textMuted,
  ...props
}: InputProps) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text variant="body" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, inputStyle]}
        placeholderTextColor={placeholderTextColor}
        {...props}
      />
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm, color: colors.text },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.text,
    minHeight: 48,
  },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, marginTop: spacing.xs },
});
