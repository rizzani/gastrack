import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCustomers } from '@/hooks/useCustomers';
import { spacing } from '@/constants/theme';

type CustomerFormProps = {
  onSuccess?: (customer?: { id: string }) => void;
  initialData?: {
    id?: string;
    name?: string;
    phone?: string;
    notes?: string;
  };
};

export function CustomerForm({ onSuccess, initialData }: CustomerFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const { create, update } = useCustomers();
  const isEditing = !!initialData?.id;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      if (isEditing && initialData?.id) {
        const updatedCustomer = await update.mutateAsync({
          id: initialData.id,
          patch: {
            name: name.trim(),
            phone: phone.trim() || undefined,
            notes: notes.trim() || undefined,
          },
        });
        Alert.alert('Success', 'Customer updated successfully');
        onSuccess?.(updatedCustomer);
      } else {
        const newCustomer = await create.mutateAsync({
          name: name.trim(),
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        Alert.alert('Success', 'Customer added successfully');
        onSuccess?.(newCustomer);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save customer');
    }
  };

  return (
    <View style={styles.container}>
      <Input
        label="Name *"
        value={name}
        onChangeText={setName}
        placeholder="Enter customer name"
        autoFocus
      />

      <Input
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
      />

      <Input
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Additional notes"
        multiline
        numberOfLines={4}
      />

      <Button
        title={isEditing ? 'Update Customer' : 'Add Customer'}
        onPress={handleSubmit}
        loading={create.isPending || update.isPending}
        style={styles.submitButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});
