/**
 * F11: Refill price stats with actionable insights from price history.
 */

import type { PriceRecord } from './types';

export type RefillPriceStats = {
  // Current prices
  currentSellPrice: number;
  currentRefillCost: number;
  currentMargin: number;
  currentMarginPercent: number;

  // Price changes
  sellPriceChange: number | null;
  sellPriceChangePercent: number | null;
  refillCostChange: number | null;
  refillCostChangePercent: number | null;
  marginChange: number | null;
  marginChangePercent: number | null;

  // Timing
  daysSinceLastChange: number | null;
  lastChangeDate: string | null;

  // Trends
  sellPriceTrend: 'increasing' | 'decreasing' | 'stable' | null;
  refillCostTrend: 'increasing' | 'decreasing' | 'stable' | null;
  marginTrend: 'increasing' | 'decreasing' | 'stable' | null;

  // History summary
  totalChanges: number;
  changesLast30Days: number;
  changesLast90Days: number;

  // Data quality
  hasEnoughData: boolean;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compute actionable stats from price history (newest-first).
 */
export function getRefillPriceStats(history: PriceRecord[]): RefillPriceStats {
  if (history.length === 0) {
    return {
      currentSellPrice: 0,
      currentRefillCost: 0,
      currentMargin: 0,
      currentMarginPercent: 0,
      sellPriceChange: null,
      sellPriceChangePercent: null,
      refillCostChange: null,
      refillCostChangePercent: null,
      marginChange: null,
      marginChangePercent: null,
      daysSinceLastChange: null,
      lastChangeDate: null,
      sellPriceTrend: null,
      refillCostTrend: null,
      marginTrend: null,
      totalChanges: 0,
      changesLast30Days: 0,
      changesLast90Days: 0,
      hasEnoughData: false,
    };
  }

  const now = Date.now();
  const t30 = now - 30 * MS_PER_DAY;
  const t90 = now - 90 * MS_PER_DAY;

  // Current (most recent) prices
  const current = history[0];
  const currentSellPrice = current.sellUnitPrice;
  const currentRefillCost = current.refillUnitCost;
  const currentMargin = currentSellPrice - currentRefillCost;
  const currentMarginPercent =
    currentSellPrice > 0 ? (currentMargin / currentSellPrice) * 100 : 0;

  // Previous prices (if available)
  const previous = history.length >= 2 ? history[1] : null;

  // Calculate changes
  let sellPriceChange: number | null = null;
  let sellPriceChangePercent: number | null = null;
  let refillCostChange: number | null = null;
  let refillCostChangePercent: number | null = null;
  let marginChange: number | null = null;
  let marginChangePercent: number | null = null;

  if (previous) {
    sellPriceChange = currentSellPrice - previous.sellUnitPrice;
    sellPriceChangePercent =
      previous.sellUnitPrice > 0
        ? (sellPriceChange / previous.sellUnitPrice) * 100
        : null;

    refillCostChange = currentRefillCost - previous.refillUnitCost;
    refillCostChangePercent =
      previous.refillUnitCost > 0
        ? (refillCostChange / previous.refillUnitCost) * 100
        : null;

    const previousMargin = previous.sellUnitPrice - previous.refillUnitCost;
    marginChange = currentMargin - previousMargin;
    marginChangePercent =
      previousMargin !== 0 ? (marginChange / Math.abs(previousMargin)) * 100 : null;
  }

  // Days since last change
  const lastChangeTime = new Date(current.effectiveFrom).getTime();
  const daysSinceLastChange = Math.floor((now - lastChangeTime) / MS_PER_DAY);

  // Determine trends (compare current with previous, or look at last 3 if available)
  let sellPriceTrend: 'increasing' | 'decreasing' | 'stable' | null = null;
  let refillCostTrend: 'increasing' | 'decreasing' | 'stable' | null = null;
  let marginTrend: 'increasing' | 'decreasing' | 'stable' | null = null;

  if (history.length >= 2) {
    // Compare current with previous
    if (previous) {
      const sellDiff = currentSellPrice - previous.sellUnitPrice;
      sellPriceTrend =
        Math.abs(sellDiff) < 0.01 ? 'stable' : sellDiff > 0 ? 'increasing' : 'decreasing';

      const refillDiff = currentRefillCost - previous.refillUnitCost;
      refillCostTrend =
        Math.abs(refillDiff) < 0.01
          ? 'stable'
          : refillDiff > 0
            ? 'increasing'
            : 'decreasing';

      const currentM = currentMargin;
      const previousM = previous.sellUnitPrice - previous.refillUnitCost;
      const marginDiff = currentM - previousM;
      marginTrend =
        Math.abs(marginDiff) < 0.01 ? 'stable' : marginDiff > 0 ? 'increasing' : 'decreasing';
    }
  }

  // Count changes in time periods
  const changesLast30Days = history.filter(
    (p) => new Date(p.effectiveFrom).getTime() >= t30
  ).length;
  const changesLast90Days = history.filter(
    (p) => new Date(p.effectiveFrom).getTime() >= t90
  ).length;

  return {
    currentSellPrice,
    currentRefillCost,
    currentMargin,
    currentMarginPercent,
    sellPriceChange,
    sellPriceChangePercent,
    refillCostChange,
    refillCostChangePercent,
    marginChange,
    marginChangePercent,
    daysSinceLastChange,
    lastChangeDate: current.effectiveFrom,
    sellPriceTrend,
    refillCostTrend,
    marginTrend,
    totalChanges: history.length,
    changesLast30Days,
    changesLast90Days,
    hasEnoughData: history.length >= 1,
  };
}
