import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Image, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenFlatList } from '@/components/ui/ScreenFlatList';
import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { ErrorWithRetry } from '@/components/ui/ErrorWithRetry';
import { useCylinderTypes } from '@/hooks/useCylinderTypes';
import { useInventory } from '@/hooks/useInventory';
import { setCylinderTypePickerResult } from '@/lib/pickerResult';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { CylinderType, MovementType } from '@/lib/types';

export default function CylinderTypesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectMode?: string; movementType?: MovementType }>();
  const isSelectMode = params.selectMode === 'true';
  const movementType = params.movementType;
  const { cylinderTypes, isLoading: isLoadingCylinderTypes, isError, error, refetch } = useCylinderTypes();
  const { list: inventory, isLoading: isLoadingInventory } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter based on movement type
  // Add (full/empty): show all types — we can add to any, including no inventory yet
  // Restock: only types with empty > 0
  // Other (sell/loan/return): only types with full > 0
  const availableCylinderTypes = useMemo(() => {
    if (movementType === 'add') {
      return [...cylinderTypes];
    }
    if (isLoadingInventory) return [];
    if (movementType === 'restock') {
      const cylinderTypeIdsWithEmpty = new Set(
        inventory
          .filter((inv) => inv.empty > 0)
          .map((inv) => inv.cylinderTypeId)
      );
      return cylinderTypes.filter((ct) => cylinderTypeIdsWithEmpty.has(ct.id));
    }
    const cylinderTypeIdsWithFull = new Set(
      inventory
        .filter((inv) => inv.full > 0)
        .map((inv) => inv.cylinderTypeId)
    );
    return cylinderTypes.filter((ct) => cylinderTypeIdsWithFull.has(ct.id));
  }, [cylinderTypes, inventory, isLoadingInventory, movementType]);

  const filteredCylinderTypes = availableCylinderTypes.filter((ct) =>
    ct.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = isLoadingCylinderTypes || isLoadingInventory;

  if (isLoading) {
    return (
      <ScreenFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="cube-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.headerContent}>
                <Skeleton width={180} height={32} style={styles.titleSkeleton} />
              </View>
            </View>
            <Skeleton width="100%" height={44} style={styles.searchSkeleton} />
            <SkeletonList count={5} />
          </View>
        }
      />
    );
  }

  if (isError) {
    return (
      <ScreenFlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="cube-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.headerContent}>
                <Text style={styles.title}>
                  {isSelectMode ? 'Select Cylinder Type' : 'Cylinder Types'}
                </Text>
              </View>
            </View>
            <ErrorWithRetry
              message={error?.message ?? 'Error loading cylinder types.'}
              onRetry={() => refetch()}
            />
          </View>
        }
      />
    );
  }

  return (
    <ScreenFlatList<CylinderType>
      data={filteredCylinderTypes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => {
            if (isSelectMode) {
              setCylinderTypePickerResult({
                selectedCylinderTypeId: item.id,
                movementType,
              });
              router.back();
            }
          }}
        >
          <Card variant="default" style={styles.card}>
            <View style={styles.cardContent}>
              {item.img ? (
                <Image
                  source={{ uri: item.img }}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.cardImagePlaceholder}>
                  <Ionicons name="cube-outline" size={24} color={colors.textTertiary} />
                </View>
              )}
              <Text style={styles.cardText}>{item.label}</Text>
              {isSelectMode && (
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              )}
            </View>
          </Card>
        </Pressable>
      )}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="cube-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {isSelectMode ? 'Select Cylinder Type' : 'Cylinder Types'}
              </Text>
              {!isSelectMode && (
                <Text style={styles.subtitle}>
                  {filteredCylinderTypes.length} {filteredCylinderTypes.length === 1 ? 'type' : 'types'} available
                </Text>
              )}
            </View>
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons 
              name={searchQuery ? "search-outline" : "cube-outline"} 
              size={64} 
              color={colors.textTertiary} 
            />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery
              ? 'No cylinder types found'
              : movementType === 'restock'
                ? 'No empty inventory'
                : movementType === 'add'
                  ? 'No cylinder types'
                  : 'No full inventory'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Try a different search term'
              : movementType === 'restock'
                ? 'No cylinder types have empty inventory available'
                : movementType === 'add'
                  ? 'Add cylinder types in app settings first'
                  : 'No cylinder types have full inventory available'}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  titleSkeleton: { flex: 1, marginRight: spacing.sm },
  searchSkeleton: { marginBottom: spacing.md },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
  },
  card: {
    marginVertical: spacing.sm,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
  },
  cardImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    ...typography.bodySemibold,
    color: colors.text,
    flex: 1,
  },
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
