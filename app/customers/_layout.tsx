import { Stack } from 'expo-router';

export default function CustomersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Customers' }} />
      <Stack.Screen name="new" options={{ title: 'New Customer' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Customer' }} />
      <Stack.Screen name="[id]" options={{ title: 'Customer Details' }} />
    </Stack>
  );
}
