import { Pressable, Text, StyleSheet, ActivityIndicator, type PressableProps } from 'react-native';
import { colors, typography, borderRadius, shadows } from '@/constants/theme';

type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export function Button({ 
  title, 
  variant = 'primary', 
  size = 'md',
  loading, 
  disabled, 
  style, 
  ...props 
}: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        styles[size],
        styles[variant],
        (loading || disabled) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? colors.surface : colors.primary} 
          size="small"
        />
      ) : (
        <Text style={[
          styles.text, 
          size === 'sm' && styles.textSm,
          size === 'lg' && styles.textLg,
          styles[`${variant}Text`]
        ]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 52,
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.bodySemibold,
  },
  textSm: {
    ...typography.smallSemibold,
  },
  textLg: {
    ...typography.h4,
  },
  primaryText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
});
