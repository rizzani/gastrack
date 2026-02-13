/**
 * Type definitions and Appwrite document conversion functions.
 */

import type { Models } from 'appwrite';

// ============================================================================
// Movement Types
// ============================================================================

export type MovementType = 'swap' | 'loan' | 'return' | 'restock' | 'add';

export type AddKind = 'full' | 'empty';

// ============================================================================
// Inventory
// ============================================================================

export type InventoryRecord = {
  id: string;
  cylinderTypeId: string;
  full: number;
  empty: number;
  damaged: number;
};

type AppwriteInventory = Models.Document & {
  userId: string;
  cylinderTypeId: string;
  full: number;
  empty: number;
  damaged: number;
};

export function fromAppwriteInventory(doc: AppwriteInventory): InventoryRecord {
  return {
    id: doc.$id,
    cylinderTypeId: doc.cylinderTypeId,
    full: Number(doc.full ?? 0),
    empty: Number(doc.empty ?? 0),
    damaged: Number(doc.damaged ?? 0),
  };
}

// ============================================================================
// Customer
// ============================================================================

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
};

type AppwriteCustomer = Models.Document & {
  userId: string;
  name: string;
  phone?: string;
  notes?: string;
};

export function fromAppwriteCustomer(doc: AppwriteCustomer): Customer {
  return {
    id: doc.$id,
    name: doc.name,
    phone: doc.phone,
    notes: doc.notes,
  };
}

// ============================================================================
// Movement
// ============================================================================

export type Movement = {
  id: string;
  type: MovementType;
  cylinderTypeId: string;
  quantity: number;
  customerId?: string;
  notes?: string;
  createdAt: string;
  /** When type is 'add': 'full' | 'empty'. */
  addKind?: AddKind;
};

type AppwriteMovement = Models.Document & {
  userId: string;
  type: MovementType;
  cylinderTypeId: string;
  quantity: number;
  customerId?: string;
  notes?: string;
  createdAt: string;
  addKind?: AddKind;
};

export function fromAppwriteMovement(doc: AppwriteMovement): Movement {
  return {
    id: doc.$id,
    type: doc.type,
    cylinderTypeId: doc.cylinderTypeId,
    quantity: Number(doc.quantity ?? 0),
    customerId: doc.customerId,
    notes: doc.notes,
    createdAt: doc.createdAt ?? doc.$createdAt,
    addKind: doc.addKind as AddKind | undefined,
  };
}

// ============================================================================
// Owed
// ============================================================================

export type OwedRecord = {
  id: string;
  customerId: string;
  cylinderTypeId: string;
  quantity: number;
};

type AppwriteOwed = Models.Document & {
  userId: string;
  customerId: string;
  cylinderTypeId: string;
  quantity: number;
};

export function fromAppwriteOwed(doc: AppwriteOwed): OwedRecord {
  return {
    id: doc.$id,
    customerId: doc.customerId,
    cylinderTypeId: doc.cylinderTypeId,
    quantity: Number(doc.quantity ?? 0),
  };
}

// ============================================================================
// Cylinder Type
// ============================================================================

export type CylinderType = {
  id: string;
  label: string;
  img?: string;
};

type AppwriteCylinderType = Models.Document & {
  name: string;
  size: number;
  img?: string;
};

export function fromAppwriteCylinderType(doc: AppwriteCylinderType): CylinderType {
  // Combine name and size to create label (e.g., "Gas Pro 25 lb")
  const label = doc.size ? `${doc.name} ${doc.size} lb` : doc.name;
  return {
    id: doc.$id,
    label,
    img: doc.img,
  };
}

// ============================================================================
// Price Record
// ============================================================================

export type PriceRecord = {
  id: string;
  cylinderTypeId: string;
  sellUnitPrice: number;
  refillUnitCost: number;
  notes?: string;
  effectiveFrom: string;
  createdAt: string;
};

type AppwritePrice = Models.Document & {
  userId: string;
  cylinderTypeId: string;
  sellUnitPrice: number;
  refillUnitCost: number;
  notes?: string;
  effectiveFrom: string;
  createdAt: string;
};

export function fromAppwritePrice(doc: AppwritePrice): PriceRecord {
  return {
    id: doc.$id,
    cylinderTypeId: doc.cylinderTypeId,
    sellUnitPrice: Number(doc.sellUnitPrice ?? 0),
    refillUnitCost: Number(doc.refillUnitCost ?? 0),
    notes: doc.notes,
    effectiveFrom: doc.effectiveFrom ?? doc.$createdAt,
    createdAt: doc.createdAt ?? doc.$createdAt,
  };
}

// ============================================================================
// Finance Transaction
// ============================================================================

export type FinanceTransactionType =
  | 'sale_cash'
  | 'sale_credit'
  | 'payment'
  | 'refill'
  | 'expense'
  | 'add';

export type FinanceTransaction = {
  id: string;
  type: FinanceTransactionType;
  amount: number;
  customerId?: string;
  movementId?: string;
  notes?: string;
  createdAt: string;
};

type AppwriteFinanceTransaction = Models.Document & {
  userId: string;
  type: FinanceTransactionType;
  amount: number;
  customerId?: string;
  movementId?: string;
  notes?: string;
  createdAt: string;
};

export function fromAppwriteFinanceTransaction(
  doc: AppwriteFinanceTransaction
): FinanceTransaction {
  return {
    id: doc.$id,
    type: doc.type,
    amount: Number(doc.amount ?? 0),
    customerId: doc.customerId,
    movementId: doc.movementId,
    notes: doc.notes,
    createdAt: doc.createdAt ?? doc.$createdAt,
  };
}

// ============================================================================
// Customer Balance
// ============================================================================

export type CustomerBalance = {
  id: string;
  customerId: string;
  balance: number;
};

type AppwriteCustomerBalance = Models.Document & {
  userId: string;
  customerId: string;
  balance: number;
};

export function fromAppwriteCustomerBalance(
  doc: AppwriteCustomerBalance
): CustomerBalance {
  return {
    id: doc.$id,
    customerId: doc.customerId,
    balance: Number(doc.balance ?? 0),
  };
}
