import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, radii, spacing } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

const getBg = (v: ButtonVariant, pressed: boolean, disabled: boolean) => {
  if (disabled) return colors.disabled;
  if (v === 'primary') return pressed ? colors.primaryPressed : colors.primary;
  if (v === 'secondary') return pressed ? colors.border : colors.card;
  return 'transparent';
};

const getFg = (v: ButtonVariant, disabled: boolean) => {
  if (disabled) return colors.card;
  return v === 'primary' ? colors.card : colors.text;
};

const getBorder = (v: ButtonVariant) => (v === 'secondary' ? colors.border : 'transparent');

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: getBg(variant, pressed, disabled),
          borderColor: getBorder(variant),
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: disabled ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text variant="body" style={{ color: getFg(variant, disabled), fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});
