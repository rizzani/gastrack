import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, type ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, opacity },
        style,
      ]}
    />
  );
}

/** Skeleton block matching a Card-style row. */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="40%" height={18} style={styles.title} />
      <View style={styles.row}>
        <Skeleton width={60} height={14} />
        <Skeleton width={60} height={14} />
        <Skeleton width={60} height={14} />
      </View>
    </View>
  );
}

/** Skeleton for list screens (e.g. Inventory, History, Owed, Customers). */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

/** Skeleton for dashboard (summary + owed + links). */
export function SkeletonDashboard() {
  return (
    <View style={styles.dashboard}>
      <Skeleton width={180} height={28} style={styles.title} />
      <View style={styles.card}>
        <Skeleton width="50%" height={16} style={styles.mb} />
        <View style={styles.row}>
          <Skeleton width={70} height={24} />
          <Skeleton width={70} height={24} />
          <Skeleton width={70} height={24} />
        </View>
      </View>
      <View style={styles.card}>
        <Skeleton width="60%" height={16} style={styles.mb} />
        <Skeleton width="80%" height={18} />
      </View>
      <View style={styles.links}>
        <Skeleton width={140} height={16} style={styles.mb} />
        <Skeleton width="100%" height={44} style={styles.mb} />
        <Skeleton width="100%" height={44} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { marginBottom: spacing.sm },
  mb: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  list: { paddingBottom: spacing.md },
  dashboard: { paddingBottom: spacing.md },
  links: { marginTop: spacing.md },
});
