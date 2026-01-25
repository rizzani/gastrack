import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './Text';
import { colors, spacing } from '@/constants/theme';

export interface ScreenProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function Screen({ title, subtitle, children, style, contentContainerStyle }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {title ? (
          <Text variant="headline" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="body" muted style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { marginBottom: spacing.sm },
  subtitle: { marginBottom: spacing.xl },
});
