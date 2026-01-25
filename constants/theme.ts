/**
 * Theme: spacing, colors, typography, radii.
 * Use these values in UI primitives for consistency.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const colors = {
  background: '#f5f5f5',
  card: '#ffffff',
  border: '#e5e5e5',
  text: '#111111',
  textMuted: '#666666',
  primary: '#2563eb',
  primaryPressed: '#1d4ed8',
  error: '#dc2626',
  disabled: '#a3a3a3',
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
} as const;

export const fontSizes = {
  caption: 12,
  body: 14,
  sub: 16,
  title: 18,
  headline: 22,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '600' as const,
  bold: '700' as const,
};
