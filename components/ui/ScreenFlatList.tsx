import { StyleSheet, FlatList, type FlatListProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

type ScreenFlatListProps<T> = FlatListProps<T>;

export function ScreenFlatList<T>(props: ScreenFlatListProps<T>) {
  const { contentContainerStyle, ...rest } = props;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        {...rest}
        contentContainerStyle={[styles.content, contentContainerStyle]}
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
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
});
