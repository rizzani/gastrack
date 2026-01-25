import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tabs.Screen
        name="inventory"
        options={{ title: 'Inventory', tabBarLabel: 'Inventory' }}
      />
      <Tabs.Screen
        name="ledger"
        options={{ title: 'Ledger', tabBarLabel: 'Ledger' }}
      />
      <Tabs.Screen
        name="owed"
        options={{ title: 'Owed', tabBarLabel: 'Owed' }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarLabel: 'History' }}
      />
    </Tabs>
  );
}
