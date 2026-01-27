import { Stack } from 'expo-router';

export default function InventoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="new" options={{ title: 'Add Inventory' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit Inventory' }} />
    </Stack>
  );
}
