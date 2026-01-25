import { View, Pressable, ViewStyle, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors, radii, spacing } from '@/constants/theme';

export interface CardProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ title, children, onPress, style }: CardProps) {
  const content = (
    <>
      {title ? (
        <Text variant="title" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {children}
    </>
  );

  const baseStyle = [styles.card, style];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [baseStyle, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }
  return <View style={baseStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { marginBottom: spacing.sm },
  pressed: { opacity: 0.9 },
});
