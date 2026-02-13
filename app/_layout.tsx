import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { queryClient } from '../lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </AuthProvider>
  );
}
