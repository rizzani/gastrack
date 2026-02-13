import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorWithRetry } from '@/components/ui/ErrorWithRetry';
import { useInventory } from '@/hooks/useInventory';
import { useCylinderTypes } from '@/hooks/useCylinderTypes';
import { usePrices } from '@/hooks/usePrices';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '@/constants/theme';

export default function EditInventoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { list, isLoading, isError, error, refetch, createOrUpdate } =
    useInventory();
  const { cylinderTypes } = useCylinderTypes();
  const {
    getCurrentPriceForType,
    createPriceRecord,
    refetch: refetchPrices,
  } = usePrices();

  const inventory = list.find((inv) => inv.id === id);
  const cylinderType = inventory
    ? cylinderTypes.find((ct) => ct.id === inventory.cylinderTypeId)
    : null;
  const currentPrice = inventory
    ? getCurrentPriceForType(inventory.cylinderTypeId)
    : null;

  const [full, setFull] = useState<string>('');
  const [empty, setEmpty] = useState<string>('');
  const [damaged, setDamaged] = useState<string>('');
  const [defaultSellingPrice, setDefaultSellingPrice] = useState<string>('');
  const isManuallyEditingPrice = useRef<boolean>(false);
  const lastInventoryId = useRef<string>('');
  const justSavedPrice = useRef<number | null>(null);

  useEffect(() => {
    if (inventory) {
      const inventoryChanged = inventory.id !== lastInventoryId.current;

      setFull(inventory.full.toString());
      setEmpty(inventory.empty.toString());
      setDamaged(inventory.damaged.toString());

      if (inventoryChanged && !isManuallyEditingPrice.current) {
        const newPriceValue = currentPrice
          ? currentPrice.sellUnitPrice.toString()
          : '';
        setDefaultSellingPrice(newPriceValue);
        lastInventoryId.current = inventory.id;
        justSavedPrice.current = null;
      } else if (inventoryChanged) {
        lastInventoryId.current = inventory.id;
      }
    }
  }, [inventory, currentPrice]);

  useEffect(() => {
    if (inventory && currentPrice && !isManuallyEditingPrice.current) {
      const newPriceValue = currentPrice.sellUnitPrice.toString();

      if (justSavedPrice.current !== null) {
        const priceDiff = Math.abs(
          currentPrice.sellUnitPrice - justSavedPrice.current
        );
        if (priceDiff < 0.01) {
          setDefaultSellingPrice(newPriceValue);
          justSavedPrice.current = null;
        }
      } else if (defaultSellingPrice === '' || defaultSellingPrice === '0') {
        setDefaultSellingPrice(newPriceValue);
      } else {
        const fieldPrice = parseFloat(defaultSellingPrice);
        if (
          !isNaN(fieldPrice) &&
          Math.abs(fieldPrice - currentPrice.sellUnitPrice) > 0.01
        ) {
          setDefaultSellingPrice(newPriceValue);
        }
      }
    }
  }, [currentPrice, inventory]);

  const handleSave = async () => {
    if (!inventory) return;

    if (!cylinderType) {
      Alert.alert(
        'Error',
        `Cannot save: Cylinder type not found for inventory item`
      );
      return;
    }

    const fullNum = parseInt(full, 10);
    const emptyNum = parseInt(empty, 10);
    const damagedNum = parseInt(damaged, 10);

    if (isNaN(fullNum) || fullNum < 0) {
      Alert.alert('Error', 'Full count must be a non-negative number');
      return;
    }
    if (isNaN(emptyNum) || emptyNum < 0) {
      Alert.alert('Error', 'Empty count must be a non-negative number');
      return;
    }
    if (isNaN(damagedNum) || damagedNum < 0) {
      Alert.alert('Error', 'Damaged count must be a non-negative number');
      return;
    }

    let sellingPrice: number | null = null;
    const trimmedPrice = defaultSellingPrice.trim();
    if (trimmedPrice !== '') {
      const cleanedPrice = trimmedPrice.replace(/[^\d.-]/g, '');
      const priceNum = parseFloat(cleanedPrice);
      if (
        isNaN(priceNum) ||
        priceNum < 0 ||
        !isFinite(priceNum)
      ) {
        Alert.alert(
          'Error',
          'Default selling price must be a valid non-negative number'
        );
        return;
      }
      sellingPrice = priceNum;
    }

    try {
      await createOrUpdate.mutateAsync({
        cylinderTypeId: inventory.cylinderTypeId,
        patch: {
          full: fullNum,
          empty: emptyNum,
          damaged: damagedNum,
        },
      });

      if (sellingPrice !== null) {
        if (!inventory.cylinderTypeId) {
          Alert.alert(
            'Error',
            `Cannot save price: Invalid cylinder type for ${cylinderType?.label || inventory.cylinderTypeId}`
          );
          return;
        }

        try {
          const currentRefillCost = currentPrice?.refillUnitCost ?? 0;

          await createPriceRecord({
            cylinderTypeId: inventory.cylinderTypeId,
            sellUnitPrice: sellingPrice,
            refillUnitCost: currentRefillCost,
          });

          justSavedPrice.current = sellingPrice;
          setDefaultSellingPrice(sellingPrice.toString());

          await new Promise((resolve) => setTimeout(resolve, 100));
          await refetchPrices();

          await new Promise((resolve) => setTimeout(resolve, 200));
          const updatedPrice = getCurrentPriceForType(inventory.cylinderTypeId);

          if (
            updatedPrice &&
            Math.abs(updatedPrice.sellUnitPrice - sellingPrice) < 0.01
          ) {
            setDefaultSellingPrice(updatedPrice.sellUnitPrice.toString());
          } else if (updatedPrice && updatedPrice.sellUnitPrice === 0) {
            setDefaultSellingPrice(sellingPrice.toString());
          } else {
            setDefaultSellingPrice(sellingPrice.toString());
          }
          isManuallyEditingPrice.current = false;
          justSavedPrice.current = null;
        } catch (priceError: unknown) {
          const message =
            priceError instanceof Error
              ? priceError.message
              : 'Unknown error';
          Alert.alert(
            'Partial Success',
            `Inventory updated, but failed to save price: ${message}\n\nCylinder Type: ${cylinderType?.label || inventory.cylinderTypeId}\nPrice: ${sellingPrice}`,
            [{ text: 'OK' }]
          );
          return;
        }
      }

      Alert.alert('Success', 'Inventory updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update inventory';
      Alert.alert('Error', message);
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <Skeleton width="100%" height={120} style={styles.skeleton} />
        <Skeleton width="100%" height={100} style={styles.skeleton} />
        <Skeleton width="100%" height={44} style={styles.skeleton} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorWithRetry
          message={error?.message ?? 'Error loading inventory.'}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  if (!inventory) {
    return (
      <Screen>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Inventory not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const refillCost = currentPrice?.refillUnitCost ?? 0;
  const sellPriceNum = parseFloat(
    defaultSellingPrice.replace(/[^\d.-]/g, '') || '0'
  );
  const margin =
    !isNaN(sellPriceNum) && sellPriceNum > 0
      ? sellPriceNum - refillCost
      : null;
  const marginPercent =
    margin !== null && refillCost > 0
      ? (margin / refillCost) * 100
      : null;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Product hero */}
          {cylinderType && (
            <Card variant="elevated" style={styles.heroCard}>
              <View style={styles.heroContent}>
                {cylinderType.img ? (
                  <Image
                    source={{ uri: cylinderType.img }}
                    style={styles.heroImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.heroIcon}>
                    <Ionicons
                      name="flame"
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                )}
                <View style={styles.heroText}>
                  <Text style={styles.heroLabel}>{cylinderType.label}</Text>
                  <Text style={styles.heroSubtext}>Cylinder type</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Stock summary */}
          <Text style={styles.sectionLabel}>Stock on hand</Text>
          <View style={styles.statsRow}>
            <Card variant="outlined" style={styles.statCard}>
              <View style={[styles.statBadge, { backgroundColor: colors.full + '20' }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.full} />
              </View>
              <Text style={styles.statValue}>{full}</Text>
              <Text style={styles.statLabel}>Full</Text>
            </Card>
            <Card variant="outlined" style={styles.statCard}>
              <View style={[styles.statBadge, { backgroundColor: colors.empty + '20' }]}>
                <Ionicons name="ellipse-outline" size={20} color={colors.empty} />
              </View>
              <Text style={styles.statValue}>{empty}</Text>
              <Text style={styles.statLabel}>Empty</Text>
            </Card>
            <Card variant="outlined" style={styles.statCard}>
              <View style={[styles.statBadge, { backgroundColor: colors.damaged + '20' }]}>
                <Ionicons name="warning" size={20} color={colors.damaged} />
              </View>
              <Text style={styles.statValue}>{damaged}</Text>
              <Text style={styles.statLabel}>Damaged</Text>
            </Card>
          </View>

          <View style={styles.banner}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.bannerText}>
              To change stock counts, use Record → Add.
            </Text>
          </View>

          {/* Pricing */}
          <Text style={styles.sectionLabel}>Pricing</Text>
          <Card variant="elevated" style={styles.pricingCard}>
            <Input
              label="Default selling price"
              placeholder="0.00"
              value={defaultSellingPrice}
              onChangeText={(text) => {
                isManuallyEditingPrice.current = true;
                setDefaultSellingPrice(text);
              }}
              onFocus={() => {
                isManuallyEditingPrice.current = true;
              }}
              onBlur={() => {
                setTimeout(() => {
                  isManuallyEditingPrice.current = false;
                }, 200);
              }}
              keyboardType="decimal-pad"
              editable={true}
            />

            {/* Refill price insight */}
            <View style={styles.insightBlock}>
              <View style={styles.insightHeader}>
                <Ionicons name="cash-outline" size={18} color={colors.primary} />
                <Text style={styles.insightTitle}>Refill & margin</Text>
              </View>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Refill cost (per unit)</Text>
                <Text style={styles.insightValue}>
                  {refillCost > 0
                    ? `$${refillCost.toFixed(2)}`
                    : '—'}
                </Text>
              </View>
              {margin !== null && (
                <>
                  <View style={styles.insightRow}>
                    <Text style={styles.insightLabel}>Margin (sell − refill)</Text>
                    <Text
                      style={[
                        styles.insightValue,
                        margin >= 0 ? styles.insightValuePositive : styles.insightValueNegative,
                      ]}
                    >
                      {margin >= 0 ? '+' : ''}${margin.toFixed(2)}
                    </Text>
                  </View>
                  {marginPercent !== null && (
                    <View style={styles.insightRow}>
                      <Text style={styles.insightLabel}>Margin %</Text>
                      <Text
                        style={[
                          styles.insightValue,
                          margin >= 0 ? styles.insightValuePositive : styles.insightValueNegative,
                        ]}
                      >
                        {margin >= 0 ? '+' : ''}{marginPercent.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </>
              )}
              {refillCost === 0 && (
                <Text style={styles.insightHint}>
                  Set refill cost in price records to see margin here.
                </Text>
              )}
            </View>
          </Card>

          <Button
            title="Save changes"
            onPress={handleSave}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroLabel: {
    ...typography.h3,
    color: colors.text,
  },
  heroSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.smallSemibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
  },
  bannerText: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
  },
  pricingCard: {
    marginBottom: spacing.lg,
  },
  insightBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  insightTitle: {
    ...typography.smallSemibold,
    color: colors.text,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  insightLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  insightValue: {
    ...typography.smallSemibold,
    color: colors.text,
  },
  insightValuePositive: {
    color: colors.success,
  },
  insightValueNegative: {
    color: colors.error,
  },
  insightHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: spacing.sm,
  },
  skeleton: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});
