/**
 * Cylinder size/type options. IDs are used in inventory, movements, and owed.
 */

import type { CylinderType } from '@/lib/types';

export const CYLINDER_TYPES: readonly CylinderType[] = [
  { id: '25lb', label: '25 lb' },
  { id: '50lb', label: '50 lb' },
  { id: '20lb', label: '20 lb' },
  { id: '33lb', label: '33 lb' },
  { id: '100lb', label: '100 lb' },
] as const;

export type CylinderTypeId = (typeof CYLINDER_TYPES)[number]['id'];

/** Get a CylinderType by id. */
export function getCylinderType(id: string): CylinderType | undefined {
  return CYLINDER_TYPES.find((c) => c.id === id);
}
