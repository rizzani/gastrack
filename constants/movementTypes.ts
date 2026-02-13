/**
 * Movement type constants: swap, loan, return, restock, add.
 */

import type { MovementType } from '@/lib/types';

export const MOVEMENT_TYPES: readonly MovementType[] = [
  'swap',
  'loan',
  'return',
  'restock',
  'add',
] as const;

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  swap: 'Sell',
  loan: 'Loan',
  return: 'Return',
  restock: 'Restock',
  add: 'Add',
};

export function getMovementTypeLabel(type: MovementType): string {
  return MOVEMENT_TYPE_LABELS[type];
}
