import { StyleSheet, FlatList, Platform, type FlatListProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export const TAB_BAR_CLEARANCE = Platform.OS === 'ios' ? 124 : 88;

type ScreenFlatListProps<T> = FlatListProps<T>;

export function ScreenFlatList<T>(props: ScreenFlatListProps<T>) {
  const { contentContainerStyle, ...rest } = props;
  const { horizontalPadding } = useResponsive();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        {...rest}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: spacing.xl + TAB_BAR_CLEARANCE,
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
  },
});
