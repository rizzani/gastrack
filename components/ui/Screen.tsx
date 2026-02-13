import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

type ScreenProps = ScrollViewProps & {
  children: React.ReactNode;
};

export function Screen({ children, style, contentContainerStyle, ...props }: ScreenProps) {
  const { horizontalPadding } = useResponsive();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={[styles.scrollView, style]}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: horizontalPadding, paddingBottom: spacing.xl },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...props}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.md,
  },
});
