import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, fontSizes } from '@/constants/theme';

export type TextVariant = 'headline' | 'title' | 'sub' | 'body' | 'caption';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  muted?: boolean;
}

const variantStyles: Record<
  TextVariant,
  { fontSize: number; fontWeight: '400' | '600' | '700' }
> = {
  headline: { fontSize: fontSizes.headline, fontWeight: '700' },
  title: { fontSize: fontSizes.title, fontWeight: '600' },
  sub: { fontSize: fontSizes.sub, fontWeight: '400' },
  body: { fontSize: fontSizes.body, fontWeight: '400' },
  caption: { fontSize: fontSizes.caption, fontWeight: '400' },
};

export function Text({ variant = 'body', muted, style, ...props }: TextProps) {
  const v = variantStyles[variant];
  return (
    <RNText
      style={[
        { fontSize: v.fontSize, fontWeight: v.fontWeight, color: muted ? colors.textMuted : colors.text },
        style,
      ]}
      {...props}
    />
  );
}
