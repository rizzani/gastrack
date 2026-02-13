import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '@/constants/theme';

type CardProps = ViewProps & {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

export function Card({ 
  children, 
  style, 
  variant = 'default',
  padding = 'md',
  ...props 
}: CardProps) {
  return (
    <View style={[
      styles.card,
      styles[variant],
      styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
      style
    ]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    minWidth: 0,
  },
  default: {
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    ...shadows.lg,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: spacing.sm,
  },
  paddingMd: {
    padding: spacing.md,
  },
  paddingLg: {
    padding: spacing.lg,
  },
});
