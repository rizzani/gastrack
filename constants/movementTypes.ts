/**
 * Movement type constants: swap, loan, return, restock.
 */

import type { MovementType } from '@/lib/types';

export const MOVEMENT_TYPES: readonly MovementType[] = [
  'swap',
  'loan',
  'return',
  'restock',
] as const;

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  swap: 'Swap (Full out, Empty back)',
  loan: 'Loan (Full out, no Empty back)',
  return: 'Return (Empty back, settle owed)',
  restock: 'Restock (From plant: Full +, Empty −)',
};

export function getMovementTypeLabel(type: MovementType): string {
  return MOVEMENT_TYPE_LABELS[type];
}
