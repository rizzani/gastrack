import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/constants/theme';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const { user, login, register } = useAuth();
  if (user) return <Redirect href="/(tabs)" />;
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Name is required for sign up.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(trimmedEmail, trimmedPassword);
      } else {
        await register(trimmedEmail, trimmedPassword, name.trim() || undefined);
      }
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoIcon}>
              <Ionicons name="flame" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>GasTrack</Text>
            <Text style={styles.subtitle}>
              {mode === 'login' ? 'Sign in to continue' : 'Create an account'}
            </Text>
          </View>

          <Card variant="elevated" style={styles.card}>
            <View style={styles.toggle}>
              <Pressable
                onPress={() => { setMode('login'); setError(''); }}
                style={[styles.toggleButton, mode === 'login' && styles.toggleButtonActive]}
              >
                <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                  Log in
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setMode('signup'); setError(''); }}
                style={[styles.toggleButton, mode === 'signup' && styles.toggleButtonActive]}
              >
                <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                  Sign up
                </Text>
              </Pressable>
            </View>

            {mode === 'signup' && (
              <Input
                label="Name"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
              />
            )}
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'login' ? 'password' : 'new-password'}
              editable={!loading}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                loading && styles.submitButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'login' ? 'Log in' : 'Sign up'}
                </Text>
              )}
            </Pressable>
          </Card>

          <Pressable
            onPress={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            style={styles.switchMode}
          >
            <Text style={styles.switchModeText}>
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Log in'}
            </Text>
          </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  toggleText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  error: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 48,
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    ...typography.bodySemibold,
    color: '#fff',
  },
  switchMode: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
  switchModeText: {
    ...typography.small,
    color: colors.primary,
  },
});
