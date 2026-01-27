import { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useInventory } from '@/hooks/useInventory';
import { useCylinderTypes } from '@/hooks/useCylinderTypes';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function NewInventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cylinderTypeId?: string }>();
  const { createOrUpdate } = useInventory();
  const { cylinderTypes, isLoading: isLoadingCylinderTypes } = useCylinderTypes();
  
  const [selectedCylinderTypeId, setSelectedCylinderTypeId] = useState<string>(
    params.cylinderTypeId || ''
  );
  const [full, setFull] = useState<string>('0');
  const [empty, setEmpty] = useState<string>('0');
  const [damaged, setDamaged] = useState<string>('0');

  const selectedCylinderType = cylinderTypes.find((ct) => ct.id === selectedCylinderTypeId);

  const handleSave = async () => {
    if (!selectedCylinderTypeId) {
      Alert.alert('Error', 'Please select a cylinder type');
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

    try {
      await createOrUpdate.mutateAsync({
        cylinderTypeId: selectedCylinderTypeId,
        patch: {
          full: fullNum,
          empty: emptyNum,
          damaged: damagedNum,
        },
      });
      Alert.alert('Success', 'Inventory added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to add inventory');
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.label}>
            Cylinder Type <Text style={styles.required}>*</Text>
          </Text>
          {isLoadingCylinderTypes ? (
            <Skeleton width="100%" height={44} style={styles.skeleton} />
          ) : (
            <>
              {!selectedCylinderTypeId && (
                <Text style={styles.helperText}>Select a cylinder type below</Text>
              )}
              {selectedCylinderType && (
                <Card variant="elevated" style={styles.selectedType}>
                  <View style={styles.selectedTypeContent}>
                    {selectedCylinderType.img ? (
                      <Image
                        source={{ uri: selectedCylinderType.img }}
                        style={styles.typeImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.typeImagePlaceholder}>
                        <Ionicons name="cube-outline" size={24} color={colors.primary} />
                      </View>
                    )}
                    <Text style={styles.selectedTypeText}>{selectedCylinderType.label}</Text>
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  </View>
                </Card>
              )}
              <View style={styles.optionsContainer}>
                {cylinderTypes.map((ct) => {
                  const isSelected = selectedCylinderTypeId === ct.id;
                  return (
                    <Pressable
                      key={ct.id}
                      style={[
                        styles.option,
                        isSelected && styles.optionSelected,
                      ]}
                      onPress={() => setSelectedCylinderTypeId(ct.id)}
                    >
                      <Card variant={isSelected ? 'elevated' : 'outlined'} style={styles.optionCard}>
                        <View style={styles.optionContent}>
                          {ct.img ? (
                            <Image
                              source={{ uri: ct.img }}
                              style={styles.optionImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={styles.optionImagePlaceholder}>
                              <Ionicons name="cube-outline" size={20} color={isSelected ? colors.primary : colors.textTertiary} />
                            </View>
                          )}
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected,
                            ]}
                          >
                            {ct.label}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                          )}
                        </View>
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Initial Counts</Text>
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

        <Button
          title="Add Inventory"
          onPress={handleSave}
          loading={createOrUpdate.isPending}
          disabled={!selectedCylinderTypeId}
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
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.smallSemibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  selectedType: {
    marginBottom: spacing.md,
  },
  selectedTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  typeImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
  },
  typeImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTypeText: {
    ...typography.bodySemibold,
    color: colors.text,
    flex: 1,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  option: {
    marginBottom: 0,
  },
  optionCard: {
    marginVertical: 0,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionImage: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
  },
  optionImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  optionTextSelected: {
    ...typography.bodySemibold,
    color: colors.primary,
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
  },
});
