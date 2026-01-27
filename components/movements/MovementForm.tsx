import { useState, useEffect, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Alert, Image, Switch } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MovementTypePicker } from './MovementTypePicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useQueryClient } from '@tanstack/react-query';
import { useMovements } from '@/hooks/useMovements';
import { useCylinderTypes } from '@/hooks/useCylinderTypes';
import { useCustomers } from '@/hooks/useCustomers';
import { usePrices } from '@/hooks/usePrices';
import { useFinance } from '@/hooks/useFinance';
import { useOwed } from '@/hooks/useOwed';
import { useInventory } from '@/hooks/useInventory';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { queryKeys } from '@/lib/queryKeys';
import type { MovementType, Customer } from '@/lib/types';

function formatMoney(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type MovementFormRef = {
  reset: () => void;
};

export const MovementForm = forwardRef<MovementFormRef>((props, ref) => {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedCustomerId?: string; selectedCylinderTypeId?: string; movementType?: MovementType; quantity?: string }>();
  const [type, setType] = useState<MovementType | undefined>(params.movementType);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cylinderTypeId, setCylinderTypeId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>(params.quantity || '1');
  const [notes, setNotes] = useState<string>('');
  const [payLater, setPayLater] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refillTotal, setRefillTotal] = useState<string>('');
  const lastProcessedCustomerId = useRef<string | null>(null);
  const lastProcessedCylinderTypeId = useRef<string | null>(null);
  const previousType = useRef<MovementType | undefined>(params.movementType);

  const queryClient = useQueryClient();
  const { create } = useMovements();
  const { cylinderTypes, isLoading: isLoadingCylinderTypes } = useCylinderTypes();
  const { customers } = useCustomers();
  const { getCurrentPriceForType, currentPricesMap, createPriceRecord, refetch: refetchPrices } = usePrices();
  const { createTransaction, outstanding } = useFinance();
  const { byCustomer: owedByCustomer } = useOwed();
  const { record: inventoryRecord } = useInventory(type === 'restock' && cylinderTypeId ? cylinderTypeId : undefined);
  const lastAutoFillCylinderTypeId = useRef<string>('');
  const lastAutoFillQuantity = useRef<string>('');
  const isManuallyEditingAmount = useRef<boolean>(false);
  const isManuallyEditingRefillTotal = useRef<boolean>(false);
  const hasPrefilledRefillTotal = useRef<boolean>(false);
  const isManuallyEditingQuantity = useRef<boolean>(false);
  const lastRestockCylinderTypeId = useRef<string>('');

  // Reset function to clear all form state
  const resetForm = () => {
    setType(undefined);
    setCustomer(null);
    setCylinderTypeId('');
    setQuantity('1');
    setNotes('');
    setPayLater(false);
    setAmount('');
    setRefillTotal('');
    lastProcessedCustomerId.current = null;
    lastProcessedCylinderTypeId.current = null;
    lastAutoFillCylinderTypeId.current = '';
    lastAutoFillQuantity.current = '';
    isManuallyEditingAmount.current = false;
    isManuallyEditingRefillTotal.current = false;
    hasPrefilledRefillTotal.current = false;
    isManuallyEditingQuantity.current = false;
    lastRestockCylinderTypeId.current = '';
    router.setParams({ movementType: undefined, selectedCustomerId: undefined, selectedCylinderTypeId: undefined, quantity: undefined });
  };

  // Expose reset function via ref
  useImperativeHandle(ref, () => ({
    reset: resetForm,
  }));

  // Sync type from URL params
  useEffect(() => {
    if (params.movementType && params.movementType !== type) {
      setType(params.movementType);
      previousType.current = params.movementType;
    }
  }, [params.movementType]);

  // Sync quantity from URL params
  useEffect(() => {
    if (params.quantity && params.quantity !== quantity) {
      setQuantity(params.quantity);
    }
  }, [params.quantity]);

  // Update URL params when type changes
  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    router.setParams({ movementType: newType });
    // Clear customer and cylinder type when movement type changes (enforce order)
    setCustomer(null);
    setCylinderTypeId('');
    lastProcessedCustomerId.current = null;
    lastProcessedCylinderTypeId.current = null;
    router.setParams({ selectedCustomerId: undefined, selectedCylinderTypeId: undefined });
  };

  // Handle customer selection from navigation
  const processCustomerSelection = () => {
    if (params.selectedCustomerId && params.selectedCustomerId !== lastProcessedCustomerId.current) {
      // Wait for customers to be loaded before processing selection
      if (customers.length > 0 || params.selectedCustomerId) {
        const selectedCustomer = customers.find((c) => c.id === params.selectedCustomerId);
        if (selectedCustomer) {
          setCustomer(selectedCustomer);
          lastProcessedCustomerId.current = params.selectedCustomerId;
        } else if (customers.length > 0) {
          // Customer not found, clear the param to avoid stuck state
          router.setParams({ selectedCustomerId: undefined });
          lastProcessedCustomerId.current = null;
        }
      }
    }
  };

  useEffect(() => {
    processCustomerSelection();
  }, [params.selectedCustomerId, customers, router]);

  // Re-check params when screen comes into focus (handles navigation edge cases)
  useFocusEffect(
    useCallback(() => {
      processCustomerSelection();
    }, [params.selectedCustomerId, customers, router])
  );

  // Handle cylinder type selection from navigation
  const processCylinderTypeSelection = () => {
    if (params.selectedCylinderTypeId && params.selectedCylinderTypeId !== lastProcessedCylinderTypeId.current) {
      // Wait for cylinder types to be loaded before processing selection
      if (cylinderTypes.length > 0 || params.selectedCylinderTypeId) {
        const selectedCylinderType = cylinderTypes.find((c) => c.id === params.selectedCylinderTypeId);
        if (selectedCylinderType) {
          setCylinderTypeId(params.selectedCylinderTypeId);
          lastProcessedCylinderTypeId.current = params.selectedCylinderTypeId;
        } else if (cylinderTypes.length > 0) {
          // Cylinder type not found, clear the param to avoid stuck state
          router.setParams({ selectedCylinderTypeId: undefined });
          lastProcessedCylinderTypeId.current = null;
        }
      }
    }
  };

  useEffect(() => {
    processCylinderTypeSelection();
  }, [params.selectedCylinderTypeId, cylinderTypes, router]);

  // Re-check params when screen comes into focus (handles navigation edge cases)
  useFocusEffect(
    useCallback(() => {
      processCylinderTypeSelection();
    }, [params.selectedCylinderTypeId, cylinderTypes, router])
  );

  // Clear cylinder type selection when switching to/from restock
  // since restock uses empty inventory while others use full inventory
  useEffect(() => {
    const wasRestock = previousType.current === 'restock';
    const isRestock = type === 'restock';
    
    if (wasRestock !== isRestock && type !== undefined) {
      setCylinderTypeId('');
      lastProcessedCylinderTypeId.current = null;
      lastRestockCylinderTypeId.current = '';
      isManuallyEditingQuantity.current = false;
      // Clear selectedCylinderTypeId from URL params when movement type changes
      router.setParams({ selectedCylinderTypeId: undefined });
    }
    
    previousType.current = type;
  }, [type, router]);

  // Set quantity to empty count when cylinder type is selected during restock
  useEffect(() => {
    if (type === 'restock' && cylinderTypeId && inventoryRecord && !isManuallyEditingQuantity.current) {
      // Only update if the cylinder type changed (not if user is editing quantity)
      if (cylinderTypeId !== lastRestockCylinderTypeId.current) {
        const emptyCount = inventoryRecord.empty ?? 0;
        setQuantity(emptyCount > 0 ? String(emptyCount) : '1');
        lastRestockCylinderTypeId.current = cylinderTypeId;
      }
    } else if (type !== 'restock') {
      // Reset the ref when not in restock mode
      lastRestockCylinderTypeId.current = '';
    }
  }, [type, cylinderTypeId, inventoryRecord]);

  const needsCustomer = type === 'swap' || type === 'loan' || type === 'return';
  const isSale = type === 'swap' || type === 'loan';
  const selectedCylinderType = cylinderTypes.find((c) => c.id === cylinderTypeId);

  // Clear cylinder type when customer changes (if customer is required)
  // This enforces the order: movement -> customer -> cylinder
  useEffect(() => {
    if (needsCustomer && !customer && cylinderTypeId) {
      // Customer was cleared, so clear cylinder type too
      setCylinderTypeId('');
      lastProcessedCylinderTypeId.current = null;
      lastRestockCylinderTypeId.current = '';
      router.setParams({ selectedCylinderTypeId: undefined });
    }
  }, [needsCustomer, customer, cylinderTypeId, router]);

  const { totalOwed, owedBreakdown, creditBalance, hasOwedOrCredit } = useMemo(() => {
    if (!needsCustomer || !customer) {
      return { totalOwed: 0, owedBreakdown: '', creditBalance: 0, hasOwedOrCredit: false };
    }
    const group = owedByCustomer.find((g) => g.customerId === customer.id) ?? null;
    const total = group ? group.records.reduce((s, r) => s + r.quantity, 0) : 0;
    const getLabel = (cid: string) => cylinderTypes.find((c) => c.id === cid)?.label ?? cid;
    const breakdown = group
      ? group.records.map((r) => `${r.quantity}× ${getLabel(r.cylinderTypeId)}`).join(', ')
      : '';
    const balance = outstanding.find((b) => b.customerId === customer.id)?.balance ?? 0;
    return {
      totalOwed: total,
      owedBreakdown: breakdown,
      creditBalance: balance,
      hasOwedOrCredit: total > 0 || balance > 0,
    };
  }, [needsCustomer, customer, owedByCustomer, outstanding, cylinderTypes]);

  // Memoize the price to avoid unnecessary recalculations
  const sellUnitPrice = useMemo(() => {
    if (!cylinderTypeId) return 0;
    return currentPricesMap.get(cylinderTypeId)?.sellUnitPrice ?? 0;
  }, [cylinderTypeId, currentPricesMap]);

  // Prefill amount = sellUnitPrice × qty when cylinder type or quantity changes (swap/loan only)
  // Only auto-fill when cylinderTypeId or quantity changes, not when user is typing
  useEffect(() => {
    if (!isSale || !cylinderTypeId) {
      lastAutoFillCylinderTypeId.current = '';
      lastAutoFillQuantity.current = '';
      return;
    }
    
    // Check if cylinder type or quantity actually changed
    const cylinderTypeChanged = cylinderTypeId !== lastAutoFillCylinderTypeId.current;
    const quantityChanged = quantity !== lastAutoFillQuantity.current;
    
    // Only auto-fill if cylinder type or quantity changed and user is not manually editing
    if ((cylinderTypeChanged || quantityChanged) && !isManuallyEditingAmount.current) {
      const qty = parseInt(quantity, 10) || 0;
      const calculatedAmount = qty > 0 && sellUnitPrice >= 0 ? String(sellUnitPrice * qty) : '';
      setAmount(calculatedAmount);
      lastAutoFillCylinderTypeId.current = cylinderTypeId;
      lastAutoFillQuantity.current = quantity;
    } else if (cylinderTypeChanged || quantityChanged) {
      // Update refs even if we don't auto-fill (user is editing)
      lastAutoFillCylinderTypeId.current = cylinderTypeId;
      lastAutoFillQuantity.current = quantity;
    }
  }, [isSale, cylinderTypeId, quantity, sellUnitPrice]);

  // Reset payment state when switching away from swap/loan
  useEffect(() => {
    if (!isSale) {
      setPayLater(false);
      setAmount('');
    }
  }, [isSale]);

  // Prefill refill total when restock cylinder type or quantity changes
  useEffect(() => {
    if (type !== 'restock' || !cylinderTypeId) {
      hasPrefilledRefillTotal.current = false;
      return;
    }
    // Only auto-fill if we haven't prefilled yet and user is not manually editing
    if (!hasPrefilledRefillTotal.current && !isManuallyEditingRefillTotal.current) {
      const price = currentPricesMap.get(cylinderTypeId);
      const refill = price?.refillUnitCost ?? 0;
      const qty = parseInt(quantity, 10) || 0;
      setRefillTotal(qty > 0 ? String(refill * qty) : '');
      hasPrefilledRefillTotal.current = true;
    }
  }, [type, cylinderTypeId, quantity, currentPricesMap]);

  const handleSubmit = async () => {
    if (!type) {
      Alert.alert('Error', 'Please select a movement type');
      return;
    }
    if (needsCustomer && !customer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    if (!cylinderTypeId) {
      Alert.alert('Error', 'Please select a cylinder type');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    if (isSale) {
      const amt = parseFloat(amount);
      if (!Number.isFinite(amt) || amt < 0) {
        Alert.alert('Error', 'Please enter a valid payment amount');
        return;
      }
      if (payLater && !customer) {
        Alert.alert('Error', 'Customer is required when recording credit (Pay later).');
        return;
      }
    }
    if (type === 'restock') {
      const total = parseFloat(refillTotal);
      if (!Number.isFinite(total) || total < 0) {
        Alert.alert('Error', 'Please enter a valid refill cost');
        return;
      }
    }

    const performRecord = async () => {
      setIsSubmitting(true);
      try {
        const { movementId } = await create.mutateAsync({
          type,
          cylinderTypeId,
          quantity: qty,
          customerId: type === 'restock' ? undefined : customer?.id,
          notes: notes.trim() || undefined,
        });

        if (type === 'restock') {
          // Save refill cost transaction immediately with the movement
          const total = parseFloat(refillTotal);
          const perUnit = qty > 0 ? total / qty : 0;
          const current = getCurrentPriceForType(cylinderTypeId);
          const currentRefill = current?.refillUnitCost ?? 0;
          const sellUnitPrice = current?.sellUnitPrice ?? 0;
          const eps = 1e-6;
          const priceChanged = Math.abs(perUnit - currentRefill) > eps;

          await createTransaction({
            type: 'refill',
            amount: total,
            movementId,
            notes: notes.trim() || undefined,
          });

          // Refetch prices and invalidate inventory after saving refill cost
          await refetchPrices();
          queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.inventory.byType(cylinderTypeId) });

          // If price changed, ask if user wants to save as new price
          if (priceChanged) {
            Alert.alert(
              'Save new refill price?',
              'Save this as the new refill price going forward?',
              [
                {
                  text: 'No',
                  style: 'cancel',
                  onPress: () => {
                    finishRestock();
                  },
                },
                {
                  text: 'Yes',
                  onPress: async () => {
                    try {
                      await createPriceRecord({
                        cylinderTypeId,
                        sellUnitPrice,
                        refillUnitCost: perUnit,
                        notes: notes.trim() || undefined,
                      });
                      await refetchPrices();
                      finishRestock();
                    } catch (e: any) {
                      Alert.alert('Error', e?.message || 'Failed to save new refill price.');
                    }
                  },
                },
              ]
            );
            setIsSubmitting(false);
            return;
          }

          finishRestock();
          return;
        }

        if (isSale) {
          const amt = parseFloat(amount);
          await createTransaction({
            type: payLater ? 'sale_credit' : 'sale_cash',
            amount: amt,
            customerId: payLater ? customer!.id : undefined,
            movementId,
            notes: notes.trim() || undefined,
          });
        }

        setType(undefined);
        setCustomer(null);
        setCylinderTypeId('');
        setQuantity('1');
        setNotes('');
        setPayLater(false);
        setAmount('');
        router.setParams({ movementType: undefined, quantity: undefined });

        Alert.alert('Success', 'Movement recorded successfully');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to record movement');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (needsCustomer && customer && hasOwedOrCredit) {
      const parts: string[] = [];
      if (totalOwed > 0) {
        parts.push(`This customer owes you ${totalOwed} cylinder${totalOwed !== 1 ? 's' : ''}${owedBreakdown ? `: ${owedBreakdown}.` : '.'}`);
      }
      if (creditBalance > 0) {
        parts.push(`They have an outstanding balance of $${formatMoney(creditBalance)}.`);
      }
      const confirmMsg = parts.join('\n\n') + '\n\nProceed to record anyway?';
      Alert.alert(
        'Customer has outstanding items',
        confirmMsg,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => performRecord() },
        ]
      );
      return;
    }

    await performRecord();
  };

  const finishRestock = () => {
    setRefillTotal('');
    hasPrefilledRefillTotal.current = false;
    isManuallyEditingRefillTotal.current = false;
    setType(undefined);
    setCustomer(null);
    setCylinderTypeId('');
    setQuantity('1');
    setNotes('');
    setPayLater(false);
    setAmount('');
    router.setParams({ movementType: undefined, quantity: undefined });
    Alert.alert('Success', 'Restock and refill cost recorded.');
    setIsSubmitting(false);
  };

  const amtValid = isSale ? (() => {
    const a = parseFloat(amount);
    return Number.isFinite(a) && a >= 0;
  })() : true;
  const refillTotalValid = (() => {
    const t = parseFloat(refillTotal);
    return Number.isFinite(t) && t >= 0;
  })();

  const submitDisabled =
    !type ||
    (needsCustomer && !customer) ||
    !cylinderTypeId ||
    !quantity ||
    (isSale && !amtValid) ||
    (type === 'restock' && !refillTotalValid) ||
    isSubmitting;

  return (
    <View style={styles.container}>
      <MovementTypePicker selectedType={type} onSelect={handleTypeChange} />

      {needsCustomer && (
        <View style={styles.section}>
          <Text style={styles.label}>
            Customer <Text style={styles.required}>*</Text>
            {!type && <Text style={styles.hintText}> (Select movement type first)</Text>}
          </Text>
          {customer ? (
            <Card variant="outlined" style={styles.selectedContainer}>
              <View style={styles.selectedInfo}>
                <View style={styles.selectedIcon}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View style={styles.selectedContent}>
                  <Text style={styles.selectedName}>{customer.name}</Text>
                  {customer.phone && (
                    <View style={styles.phoneRow}>
                      <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.selectedPhone}>{customer.phone}</Text>
                    </View>
                  )}
                </View>
                <Button
                  title="Change"
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    if (type) {
                      router.push(`/customers?selectMode=true&movementType=${type}`);
                    }
                  }}
                  style={styles.changeButton}
                  disabled={!type}
                />
              </View>
            </Card>
          ) : (
            <Button
              title="Select Customer"
              variant="outline"
              onPress={() => router.push(`/customers?selectMode=true&movementType=${type}`)}
              style={styles.selectButton}
              disabled={!type}
            />
          )}
        </View>
      )}

      {needsCustomer && customer && hasOwedOrCredit && (() => {
        const parts: string[] = [];
        if (totalOwed > 0) {
          parts.push(`This customer owes you ${totalOwed} cylinder${totalOwed !== 1 ? 's' : ''}${owedBreakdown ? `: ${owedBreakdown}.` : '.'}`);
        }
        if (creditBalance > 0) {
          parts.push(`They have an outstanding balance of $${formatMoney(creditBalance)}.`);
        }
        const msg = parts.join('\n\n');
        return (
          <View style={styles.section}>
            <Card variant="outlined" style={styles.warningCard}>
              <View style={styles.warningRow}>
                <Ionicons name="warning" size={22} color={colors.warning} />
                <Text style={styles.warningTitle}>Outstanding items</Text>
              </View>
              <Text style={styles.warningText}>{msg}</Text>
              <Text style={styles.warningHint}>
                You’ll be asked to confirm before recording.
              </Text>
            </Card>
          </View>
        );
      })()}

      <View style={styles.section}>
        <Text style={styles.label}>
          Cylinder Type <Text style={styles.required}>*</Text>
          {(() => {
            if (!type) {
              return <Text style={styles.hintText}> (Select movement type first)</Text>;
            }
            if (needsCustomer && !customer) {
              return <Text style={styles.hintText}> (Select customer first)</Text>;
            }
            return null;
          })()}
        </Text>
        {isLoadingCylinderTypes ? (
          <Skeleton width="100%" height={44} style={styles.skeleton} />
        ) : selectedCylinderType ? (
          <Card variant="outlined" style={styles.selectedContainer}>
            <View style={styles.selectedInfo}>
              {selectedCylinderType.img ? (
                <Image
                  source={{ uri: selectedCylinderType.img }}
                  style={styles.selectedImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.selectedImagePlaceholder}>
                  <Ionicons name="cube-outline" size={20} color={colors.primary} />
                </View>
              )}
              <Text style={styles.selectedName}>{selectedCylinderType.label}</Text>
                <Button
                  title="Change"
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    const currentType = type;
                    if (currentType) {
                      router.push({
                        pathname: '/cylinder-types',
                        params: { selectMode: 'true', movementType: currentType },
                      });
                    } else {
                      router.push({
                        pathname: '/cylinder-types',
                        params: { selectMode: 'true' },
                      });
                    }
                  }}
                  style={styles.changeButton}
                  disabled={!type || (needsCustomer && !customer)}
                />
            </View>
          </Card>
        ) : (
          <Button
            title="Select Cylinder Type"
            variant="outline"
            onPress={() => {
              const currentType = type;
              if (currentType) {
                router.push({
                  pathname: '/cylinder-types',
                  params: { selectMode: 'true', movementType: currentType },
                });
              } else {
                router.push({
                  pathname: '/cylinder-types',
                  params: { selectMode: 'true' },
                });
              }
            }}
            style={styles.selectButton}
            disabled={!type || (needsCustomer && !customer)}
          />
        )}
      </View>

      <Input
        label="Quantity *"
        placeholder="Enter quantity"
        value={quantity}
        onChangeText={(text) => {
          isManuallyEditingQuantity.current = true;
          setQuantity(text);
        }}
        onFocus={() => {
          isManuallyEditingQuantity.current = true;
        }}
        onBlur={() => {
          // Reset the flag when user finishes editing
          setTimeout(() => {
            isManuallyEditingQuantity.current = false;
          }, 200);
        }}
        keyboardType="numeric"
        editable={!!cylinderTypeId}
        error={quantity && (isNaN(parseInt(quantity, 10)) || parseInt(quantity, 10) <= 0) ? 'Must be a positive number' : undefined}
      />

      {type === 'restock' && (
        <View style={styles.section}>
          <Text style={styles.label}>Refill Cost</Text>
          {selectedCylinderType && (
            <>
              <Text style={styles.refillHint}>
                {selectedCylinderType.label} × {quantity}
              </Text>
              {(() => {
                const current = getCurrentPriceForType(cylinderTypeId);
                const refillPerUnit = current?.refillUnitCost ?? 0;
                const qty = parseInt(quantity, 10) || 0;
                const calculatedTotal = refillPerUnit > 0 && qty > 0 ? refillPerUnit * qty : 0;
                return (
                  <>
                    {refillPerUnit > 0 ? (
                      <Text style={styles.refillPerUnit}>
                        Current refill per unit: {formatMoney(refillPerUnit)}
                      </Text>
                    ) : null}
                    {calculatedTotal > 0 ? (
                      <Text style={styles.refillTotal}>
                        Expected total: {formatMoney(calculatedTotal)}
                      </Text>
                    ) : null}
                  </>
                );
              })()}
            </>
          )}
          <Input
            label="Total refill cost *"
            placeholder="0"
            value={refillTotal}
            onChangeText={(text) => {
              isManuallyEditingRefillTotal.current = true;
              setRefillTotal(text);
            }}
            onFocus={() => {
              isManuallyEditingRefillTotal.current = true;
            }}
            onBlur={() => {
              // Reset the flag when user finishes editing
              setTimeout(() => {
                isManuallyEditingRefillTotal.current = false;
              }, 200);
            }}
            keyboardType="decimal-pad"
            editable={!!cylinderTypeId}
            error={refillTotal && !refillTotalValid ? 'Enter a valid amount' : undefined}
          />
        </View>
      )}

      {isSale && (
        <View style={styles.section}>
          <Text style={styles.label}>Payment</Text>
          <Card variant="outlined" style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentOptionRow}>
                <Ionicons 
                  name={!payLater ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={!payLater ? colors.success : colors.textTertiary} 
                />
                <Text style={[styles.paymentOption, !payLater && styles.paymentOptionSelected]}>
                  Paid now (cash)
                </Text>
              </View>
            </View>
            <View style={styles.paymentRow}>
              <View style={styles.paymentOptionRow}>
                <Ionicons 
                  name={payLater ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={payLater ? colors.warning : colors.textTertiary} 
                />
                <Text style={[styles.paymentOption, payLater && styles.paymentOptionSelected]}>
                  Pay later (credit)
                </Text>
              </View>
              <Switch
                value={payLater}
                onValueChange={setPayLater}
                trackColor={{ false: colors.gray300, true: colors.warning }}
                thumbColor={colors.surface}
              />
            </View>
          </Card>
          {payLater && (
            <View style={styles.paymentHintContainer}>
              <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
              <Text style={styles.paymentHint}>Customer is required for credit.</Text>
            </View>
          )}
          <Input
            label="Amount *"
            placeholder="0"
            value={amount}
            onChangeText={(text) => {
              isManuallyEditingAmount.current = true;
              setAmount(text);
            }}
            onFocus={() => {
              isManuallyEditingAmount.current = true;
            }}
            onBlur={() => {
              setTimeout(() => {
                isManuallyEditingAmount.current = false;
              }, 200);
            }}
            keyboardType="decimal-pad"
            editable={!!cylinderTypeId}
            error={amount && !amtValid ? 'Enter a valid amount' : undefined}
          />
        </View>
      )}

      <Input
        label="Notes (optional)"
        placeholder="Add any notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={styles.notesInput}
        editable={!!cylinderTypeId}
      />

      <Button
        title="Record Movement"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={submitDisabled}
        style={styles.submitButton}
      />
    </View>
  );
});

MovementForm.displayName = 'MovementForm';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginVertical: spacing.md,
  },
  label: {
    ...typography.smallSemibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  skeleton: {
    borderRadius: borderRadius.md,
  },
  selectButton: {
    marginTop: 0,
  },
  selectedContainer: {
    marginVertical: 0,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectedIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedContent: {
    flex: 1,
  },
  selectedName: {
    ...typography.bodySemibold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  selectedPhone: {
    ...typography.small,
    color: colors.textSecondary,
  },
  selectedImage: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
  },
  selectedImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeButton: {
    minWidth: 80,
  },
  paymentCard: {
    marginBottom: spacing.sm,
    marginVertical: 0,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  paymentOption: {
    ...typography.body,
    color: colors.text,
  },
  paymentOptionSelected: {
    ...typography.bodySemibold,
  },
  paymentHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  paymentHint: {
    ...typography.caption,
    color: colors.warning,
  },
  warningCard: {
    borderColor: colors.warning,
    backgroundColor: colors.warning + '08',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  warningTitle: {
    ...typography.smallSemibold,
    color: colors.warning,
  },
  warningText: {
    ...typography.small,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  warningHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  refillHint: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  refillPerUnit: {
    ...typography.small,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  refillTotal: {
    ...typography.smallSemibold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  hintText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
