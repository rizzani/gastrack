import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Image } from 'react-native';
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
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function EditInventoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { list, isLoading, isError, error, refetch, createOrUpdate } = useInventory();
  const { cylinderTypes } = useCylinderTypes();
  const { getCurrentPriceForType, createPriceRecord, refetch: refetchPrices } = usePrices();
  
  const inventory = list.find((inv) => inv.id === id);
  const cylinderType = inventory
    ? cylinderTypes.find((ct) => ct.id === inventory.cylinderTypeId)
    : null;
  const currentPrice = inventory ? getCurrentPriceForType(inventory.cylinderTypeId) : null;

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
      
      // Only update price if inventory changed (new item) and user is not manually editing
      if (inventoryChanged && !isManuallyEditingPrice.current) {
        const newPriceValue = currentPrice ? currentPrice.sellUnitPrice.toString() : '';
        setDefaultSellingPrice(newPriceValue);
        lastInventoryId.current = inventory.id;
        justSavedPrice.current = null; // Reset saved price flag
      } else if (inventoryChanged) {
        // Update the ref even if user is editing
        lastInventoryId.current = inventory.id;
      }
    }
  }, [inventory, currentPrice]);

  // Separate effect to update price when currentPrice loads or changes
  useEffect(() => {
    if (inventory && currentPrice && !isManuallyEditingPrice.current) {
      const newPriceValue = currentPrice.sellUnitPrice.toString();
      
      // If we just saved a price and currentPrice now matches it, update the field
      if (justSavedPrice.current !== null) {
        const priceDiff = Math.abs(currentPrice.sellUnitPrice - justSavedPrice.current);
        if (priceDiff < 0.01) {
          // This matches the price we just saved, update the field
          setDefaultSellingPrice(newPriceValue);
          justSavedPrice.current = null; // Reset flag
        }
      } else if (defaultSellingPrice === '' || defaultSellingPrice === '0') {
        // Field is empty or zero, populate it with current price
        setDefaultSellingPrice(newPriceValue);
      } else {
        // Field has a value, check if it matches current price (within small tolerance)
        const fieldPrice = parseFloat(defaultSellingPrice);
        if (!isNaN(fieldPrice) && Math.abs(fieldPrice - currentPrice.sellUnitPrice) > 0.01) {
          // Field value doesn't match current price, update it
          // This handles the case where price was saved but field wasn't updated
          setDefaultSellingPrice(newPriceValue);
        }
      }
    }
  }, [currentPrice, inventory]);

  const handleSave = async () => {
    if (!inventory) return;

    // Validate cylinder type exists
    if (!cylinderType) {
      Alert.alert('Error', `Cannot save: Cylinder type not found for inventory item`);
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

    // Validate selling price if provided
    let sellingPrice: number | null = null;
    const trimmedPrice = defaultSellingPrice.trim();
    if (trimmedPrice !== '') {
      // Remove any non-numeric characters except decimal point and minus sign
      const cleanedPrice = trimmedPrice.replace(/[^\d.-]/g, '');
      const priceNum = parseFloat(cleanedPrice);
      if (isNaN(priceNum) || priceNum < 0 || !isFinite(priceNum)) {
        Alert.alert('Error', 'Default selling price must be a valid non-negative number');
        return;
      }
      sellingPrice = priceNum;
    }

    try {
      // Update inventory
      await createOrUpdate.mutateAsync({
        cylinderTypeId: inventory.cylinderTypeId,
        patch: {
          full: fullNum,
          empty: emptyNum,
          damaged: damagedNum,
        },
      });

      // Update price if selling price is provided
      // Always save when user explicitly provides a price, even if it matches current price
      // This ensures the price is saved for items that may not have had a price set before
      if (sellingPrice !== null) {
        if (!inventory.cylinderTypeId) {
          Alert.alert('Error', `Cannot save price: Invalid cylinder type for ${cylinderType?.label || 'this item'}`);
          return;
        }

        try {
          // Get current refill cost or default to 0
          const currentRefillCost = currentPrice?.refillUnitCost ?? 0;
          
          await createPriceRecord({
            cylinderTypeId: inventory.cylinderTypeId,
            sellUnitPrice: sellingPrice,
            refillUnitCost: currentRefillCost,
          });
          
          // Mark that we just saved this price
          justSavedPrice.current = sellingPrice;
          
          // Update the price field immediately to show the saved value
          setDefaultSellingPrice(sellingPrice.toString());
          
          // Refetch prices to ensure UI updates and currentPrice reflects the new value
          // Use a small delay to ensure the database write has propagated
          await new Promise(resolve => setTimeout(resolve, 100));
          await refetchPrices();
          
          // Double-check: if currentPrice updated, ensure field shows it
          // Wait a bit more for the query to fully update
          await new Promise(resolve => setTimeout(resolve, 200));
          const updatedPrice = getCurrentPriceForType(inventory.cylinderTypeId);
          
          if (updatedPrice && Math.abs(updatedPrice.sellUnitPrice - sellingPrice) < 0.01) {
            setDefaultSellingPrice(updatedPrice.sellUnitPrice.toString());
          } else if (updatedPrice && updatedPrice.sellUnitPrice === 0) {
            // Got a price record with 0 - this is wrong, keep our saved value
            setDefaultSellingPrice(sellingPrice.toString());
          } else {
            // Price didn't update in query, but we saved it, so keep it in the field
            setDefaultSellingPrice(sellingPrice.toString());
          }
          isManuallyEditingPrice.current = false;
          justSavedPrice.current = null;
        } catch (priceError: any) {
          // If price save fails, show specific error but still show success for inventory
          Alert.alert(
            'Partial Success', 
            `Inventory updated, but failed to save price: ${priceError?.message || 'Unknown error'}\n\nCylinder Type: ${cylinderType?.label || inventory.cylinderTypeId}\nPrice: ${sellingPrice}`,
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
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update inventory');
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <Skeleton width="100%" height={44} style={styles.skeleton} />
        <Skeleton width="100%" height={44} style={styles.skeleton} />
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

  return (
    <Screen>
      <View style={styles.container}>
        {cylinderType && (
          <Card variant="elevated" style={styles.typeInfo}>
            <View style={styles.typeInfoContent}>
              {cylinderType.img ? (
                <Image
                  source={{ uri: cylinderType.img }}
                  style={styles.typeImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.typeIcon}>
                  <Ionicons name="cube" size={24} color={colors.primary} />
                </View>
              )}
              <Text style={styles.typeLabel}>{cylinderType.label}</Text>
            </View>
          </Card>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Counts</Text>
          <Input
            label="Full *"
            placeholder="Enter full count"
            value={full}
            onChangeText={setFull}
            keyboardType="numeric"
          />

          <Input
            label="Empty *"
            placeholder="Enter empty count"
            value={empty}
            onChangeText={setEmpty}
            keyboardType="numeric"
          />

          <Input
            label="Damaged *"
            placeholder="Enter damaged count"
            value={damaged}
            onChangeText={setDamaged}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <Input
            label="Default Selling Price"
            placeholder="Enter default selling price"
            value={defaultSellingPrice}
            onChangeText={(text) => {
              isManuallyEditingPrice.current = true;
              setDefaultSellingPrice(text);
            }}
            onFocus={() => {
              isManuallyEditingPrice.current = true;
            }}
            onBlur={() => {
              // Reset the flag when user finishes editing
              setTimeout(() => {
                isManuallyEditingPrice.current = false;
              }, 200);
            }}
            keyboardType="decimal-pad"
          />
          {currentPrice && (
            <View style={styles.priceHintContainer}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.priceHint}>
                Current price: {currentPrice.sellUnitPrice.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={createOrUpdate.isPending}
          style={styles.submitButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  typeInfo: {
    marginBottom: spacing.lg,
  },
  typeInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  typeImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    ...typography.h4,
    color: colors.text,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  submitButton: {
    marginTop: spacing.md,
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
  priceHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs / 2,
    marginBottom: spacing.sm,
  },
  priceHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
