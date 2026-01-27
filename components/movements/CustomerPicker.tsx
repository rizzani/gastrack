import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer } from '@/lib/types';

type CustomerPickerProps = {
  selectedCustomerId?: string;
  onSelect: (customer: Customer | null) => void;
  required?: boolean;
};

export function CustomerPicker({ selectedCustomerId, onSelect, required }: CustomerPickerProps) {
  const { customers, isLoading } = useCustomers();

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          Customer {required && <Text style={styles.required}>*</Text>}
        </Text>
        <Text style={styles.loading}>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Customer {required && <Text style={styles.required}>*</Text>}
      </Text>
      <Pressable
        style={[styles.picker, !selectedCustomer && styles.pickerEmpty]}
        onPress={() => {
          if (selectedCustomer) onSelect(null);
        }}
      >
        <Text style={[styles.pickerText, !selectedCustomer && styles.pickerTextPlaceholder]}>
          {selectedCustomer ? selectedCustomer.name : 'Select customer...'}
        </Text>
      </Pressable>
      {customers.length > 0 && (
        <View style={styles.listContainer}>
          {customers.map((item) => (
            <Pressable
              key={item.id}
              style={[
                styles.customerItem,
                selectedCustomerId === item.id && styles.customerItemSelected,
              ]}
              onPress={() => onSelect(item)}
            >
              <Text
                style={[
                  styles.customerText,
                  selectedCustomerId === item.id && styles.customerTextSelected,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  loading: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 44,
    justifyContent: 'center',
  },
  pickerEmpty: {
    borderColor: '#999',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  pickerTextPlaceholder: {
    color: '#999',
  },
  listContainer: {
    maxHeight: 200,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  customerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  customerText: {
    fontSize: 14,
    color: '#333',
  },
  customerTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
