/**
 * Responsive utilities for flexible layouts across device sizes.
 * Targets small screens like Samsung Fold cover display (~260dp).
 */

import { useWindowDimensions } from 'react-native';

// Breakpoints (dp): Fold cover ~260, small phones ~320, standard ~360+
const BREAKPOINTS = {
  veryCompact: 320, // Samsung Fold cover, very small phones
  compact: 360,
  medium: 480,
  large: 600,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isVeryCompact = width < BREAKPOINTS.veryCompact;
  const isCompact = width < BREAKPOINTS.compact;
  const isMedium = width < BREAKPOINTS.medium;
  const isLarge = width >= BREAKPOINTS.large;

  // Responsive spacing - reduce on narrow screens to maximize content
  const horizontalPadding = isVeryCompact ? 10 : isCompact ? 12 : 16;
  const gridGap = isVeryCompact ? 8 : isCompact ? 10 : 16;
  const cardPadding = isVeryCompact ? 10 : isCompact ? 12 : 16;

  // Grid column widths - for 2-col layouts, minWidth to allow wrapping
  const minCardWidth = isVeryCompact ? 120 : isCompact ? 130 : 140;

  // Tab bar - smaller on compact
  const tabBarHeight = isVeryCompact ? 56 : isCompact ? 62 : 70;
  const tabBarIconSize = isVeryCompact ? 20 : 22;
  const tabBarLabelSize = isVeryCompact ? 10 : 11;

  // Typography scaling for very compact (optional - use sparingly)
  const scaleFactor = isVeryCompact ? 0.9 : 1;

  return {
    width,
    height,
    isVeryCompact,
    isCompact,
    isMedium,
    isLarge,
    horizontalPadding,
    gridGap,
    cardPadding,
    minCardWidth,
    tabBarHeight,
    tabBarIconSize,
    tabBarLabelSize,
    scaleFactor,
    breakpoints: BREAKPOINTS,
  };
}
