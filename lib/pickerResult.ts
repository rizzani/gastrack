/**
 * Picker result store — used when returning from cylinder-types or customers
 * via router.back() so we don't remount the Record form and lose state.
 */

import type { MovementType } from './types';

export type CylinderTypePickerResult = {
  selectedCylinderTypeId: string;
  movementType?: MovementType;
};

let cylinderTypeResult: CylinderTypePickerResult | null = null;

export function getCylinderTypePickerResult(): CylinderTypePickerResult | null {
  return cylinderTypeResult;
}

export function setCylinderTypePickerResult(value: CylinderTypePickerResult): void {
  cylinderTypeResult = value;
}

export function clearCylinderTypePickerResult(): void {
  cylinderTypeResult = null;
}
