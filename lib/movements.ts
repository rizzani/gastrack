/**
 * Movement logic: pure applyMovement() and atomic executeMovement().
 *
 * Rules:
 * - swap:     Full −qty, Empty +qty
 * - loan:     Full −qty, Owed +qty
 * - return:   Empty +qty, Owed −qty
 * - restock:  Full +qty, Empty −qty
 * - add: Full +qty or Empty +qty (addKind 'full' | 'empty')
 *
 * Atomic strategy (ISSUE 014):
 * 1. Validate with applyMovement (no writes on validation failure).
 * 2. Create movement doc. On failure: nothing to rollback.
 * 3. Update inventory. On failure: delete movement (best-effort rollback), log, rethrow.
 * 4. If loan/return: create or update or delete owed. On failure: revert inventory, delete
 *    movement (best-effort rollback), log, rethrow.
 * Appwrite does not support multi-doc transactions; we do best-effort rollback and always log.
 */

import { ID } from 'appwrite';
import { db, IDs } from './appwrite';
import type { MovementType, AddKind } from './types';

// --- ApplyMovement: pure logic

export type ApplyMovementInput = {
  type: MovementType;
  quantity: number;
  full: number;
  empty: number;
  /** Current owed for (customer, cylinderType). Required for return; 0 for loan if none. */
  owed: number;
  /** For restock with insufficient empty: if present and contains "adjustment", allow override (empty → 0). */
  restockAdjustmentNote?: string;
  /** When type is 'add': 'full' | 'empty'. */
  addKind?: AddKind;
};

export type ApplyMovementResult = {
  full: number;
  empty: number;
  /** Delta to add to owed: +qty (loan), −qty (return), 0 (swap, restock). */
  owedDelta: number;
};

export class MovementError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_QUANTITY'
      | 'INSUFFICIENT_FULL'
      | 'INSUFFICIENT_EMPTY'
      | 'INSUFFICIENT_OWED'
  ) {
    super(message);
    this.name = 'MovementError';
  }
}

/**
 * Pure function: compute new inventory and owed delta for a movement.
 * Validates that outcomes are non‑negative; throws MovementError on invalid.
 */
export function applyMovement(input: ApplyMovementInput): ApplyMovementResult {
  const { type, quantity, full, empty, owed, restockAdjustmentNote, addKind } = input;

  if (quantity <= 0 || !Number.isInteger(quantity)) {
    throw new MovementError(
      `Quantity must be a positive integer, got ${quantity}`,
      'INVALID_QUANTITY'
    );
  }

  switch (type) {
    case 'swap': {
      if (full < quantity) {
        throw new MovementError(
          `Insufficient full cylinders: have ${full}, need ${quantity}`,
          'INSUFFICIENT_FULL'
        );
      }
      return { full: full - quantity, empty: empty + quantity, owedDelta: 0 };
    }
    case 'loan': {
      if (full < quantity) {
        throw new MovementError(
          `Insufficient full cylinders: have ${full}, need ${quantity}`,
          'INSUFFICIENT_FULL'
        );
      }
      return { full: full - quantity, empty, owedDelta: quantity };
    }
    case 'return': {
      if (owed < quantity) {
        throw new MovementError(
          `Insufficient owed: customer owes ${owed}, cannot return ${quantity}`,
          'INSUFFICIENT_OWED'
        );
      }
      return { full, empty: empty + quantity, owedDelta: -quantity };
    }
    case 'restock': {
      if (empty < quantity) {
        const allowOverride = !!restockAdjustmentNote?.toLowerCase().includes('adjustment');
        if (!allowOverride) {
          throw new MovementError(
            `Insufficient empty cylinders: have ${empty}, need ${quantity} to restock. Add an "adjustment" note to allow.`,
            'INSUFFICIENT_EMPTY'
          );
        }
        return { full: full + quantity, empty: 0, owedDelta: 0 };
      }
      return { full: full + quantity, empty: empty - quantity, owedDelta: 0 };
    }
    case 'add': {
      if (addKind === 'empty') {
        return { full, empty: empty + quantity, owedDelta: 0 };
      }
      return { full: full + quantity, empty, owedDelta: 0 };
    }
    default: {
      const _: never = type;
      throw new Error(`Unknown movement type: ${(_ as string) ?? type}`);
    }
  }
}

// --- ExecuteMovement: atomic update (movement + inventory + owed)

export type ExecuteMovementParams = {
  userId: string;
  type: MovementType;
  cylinderTypeId: string;
  quantity: number;
  /** Required for loan and return. */
  customerId?: string;
  notes?: string;
  /** When type is 'add': 'full' | 'empty'. */
  addKind?: AddKind;
  /** Current inventory for this cylinderType. */
  inventory: { id: string; full: number; empty: number; damaged?: number };
  /** Current owed for (customerId, cylinderTypeId). Null if none. Required for return. */
  owed: { id: string; quantity: number } | null;
};

export type ExecuteMovementResult = { movementId: string };

const ROLLBACK_LOG = '[executeMovement] rollback:';

function rollbackLog(step: string, err: unknown): void {
  console.error(ROLLBACK_LOG, step, err);
}

/**
 * Persist a movement and apply inventory + owed updates in a defined order.
 * On any write failure after creating the movement: best-effort rollback (revert
 * inventory, delete movement, restore owed if we changed it) and log. Rethrows
 * so callers can handle; no "movement saved but inventory not updated" without
 * attempted rollback and logging.
 */
export async function executeMovement(params: ExecuteMovementParams): Promise<ExecuteMovementResult> {
  const { userId, type, cylinderTypeId, quantity, customerId, notes, addKind, inventory, owed } = params;

  if ((type === 'loan' || type === 'return') && !customerId) {
    throw new MovementError('customerId is required for loan and return', 'INVALID_QUANTITY');
  }
  if (type === 'add') {
    if (customerId) throw new MovementError('Add movements do not use a customer', 'INVALID_QUANTITY');
    if (!addKind || (addKind !== 'full' && addKind !== 'empty')) {
      throw new MovementError('Add requires addKind "full" or "empty"', 'INVALID_QUANTITY');
    }
  }

  const owedQty = owed?.quantity ?? 0;
  const result = applyMovement({
    type,
    quantity,
    full: inventory.full,
    empty: inventory.empty,
    owed: owedQty,
    restockAdjustmentNote: type === 'restock' ? notes : undefined,
    addKind: type === 'add' ? addKind : undefined,
  });

  const movementData: Record<string, string | number> = {
    userId,
    type,
    cylinderTypeId,
    quantity,
    createdAt: new Date().toISOString(),
  };
  if (customerId != null) movementData.customerId = customerId;
  if (notes != null) movementData.notes = notes;
  if (type === 'add' && addKind != null) movementData.addKind = addKind;

  const movementId = ID.unique();
  await db.createDocument(IDs.database, IDs.movements, movementId, movementData);

  try {
    await db.updateDocument(IDs.database, IDs.inventory, inventory.id, {
      full: result.full,
      empty: result.empty,
      damaged: inventory.damaged ?? 0,
    });
  } catch (invErr) {
    try {
      await db.deleteDocument(IDs.database, IDs.movements, movementId);
    } catch (delErr) {
      rollbackLog('delete movement after inventory update failure', delErr);
    }
    throw invErr;
  }

  if (type === 'loan' || type === 'return') {
    const newOwed = owedQty + result.owedDelta;
    try {
      if (owed) {
        if (newOwed <= 0) {
          await db.deleteDocument(IDs.database, IDs.customer_owed, owed.id);
        } else {
          await db.updateDocument(IDs.database, IDs.customer_owed, owed.id, {
            quantity: newOwed,
          });
        }
      } else {
        if (type === 'loan' && result.owedDelta > 0) {
          await db.createDocument(IDs.database, IDs.customer_owed, ID.unique(), {
            userId,
            customerId: customerId!,
            cylinderTypeId,
            quantity: result.owedDelta,
          });
        }
        // return with no owed doc: applyMovement would have thrown INSUFFICIENT_OWED
      }
    } catch (owedErr) {
      // Rollback: revert inventory, delete movement
      try {
        await db.updateDocument(IDs.database, IDs.inventory, inventory.id, {
          full: inventory.full,
          empty: inventory.empty,
          damaged: inventory.damaged ?? 0,
        });
      } catch (rbInv) {
        rollbackLog('revert inventory after owed update failure', rbInv);
      }
      try {
        await db.deleteDocument(IDs.database, IDs.movements, movementId);
      } catch (rbMov) {
        rollbackLog('delete movement after owed update failure', rbMov);
      }
      throw owedErr;
    }
  }

  return { movementId };
}
