import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS } from '@/constants/movementTypes';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { MovementType } from '@/lib/types';

type MovementTypePickerProps = {
  selectedType?: MovementType;
  onSelect: (type: MovementType) => void;
};

const getMovementIcon = (type: MovementType) => {
  switch (type) {
    case 'swap':
      return 'swap-horizontal';
    case 'loan':
      return 'arrow-forward-circle';
    case 'return':
      return 'arrow-back-circle';
    case 'restock':
      return 'add-circle';
    default:
      return 'ellipse';
  }
};

const getMovementColor = (type: MovementType) => {
  switch (type) {
    case 'swap':
      return colors.success;
    case 'loan':
      return colors.warning;
    case 'return':
      return colors.primary;
    case 'restock':
      return colors.accent;
    default:
      return colors.textSecondary;
  }
};

export function MovementTypePicker({ selectedType, onSelect }: MovementTypePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Movement Type <Text style={styles.required}>*</Text></Text>
      <View style={styles.options}>
        {MOVEMENT_TYPES.map((type) => {
          const isSelected = selectedType === type;
          const typeColor = getMovementColor(type);
          
          return (
            <Pressable
              key={type}
              style={[
                styles.option,
                isSelected && { ...styles.optionSelected, borderColor: typeColor, backgroundColor: typeColor + '15' }
              ]}
              onPress={() => onSelect(type)}
            >
              <View style={[styles.optionIcon, { backgroundColor: isSelected ? typeColor + '20' : colors.gray100 }]}>
                <Ionicons 
                  name={getMovementIcon(type)} 
                  size={20} 
                  color={isSelected ? typeColor : colors.textSecondary} 
                />
              </View>
              <Text style={[styles.optionText, isSelected && { ...styles.optionTextSelected, color: typeColor }]}>
                {MOVEMENT_TYPE_LABELS[type]}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color={typeColor} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  options: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  optionSelected: {
    borderWidth: 2,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
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
  },
});
