/**
 * useMovements — create movement and invalidate relevant queries.
 * ISSUE 017: Create movement, invalidate relevant queries, optional customerId.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { db, IDs } from '@/lib/appwrite';
import { executeMovement } from '@/lib/movements';
import { queryKeys } from '@/lib/queryKeys';
import type { MovementType } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export type CreateMovementParams = {
  type: MovementType;
  cylinderTypeId: string;
  quantity: number;
  customerId?: string;
  notes?: string;
};

async function createMovement(
  userId: string,
  params: CreateMovementParams
): Promise<{ movementId: string }> {
  const { type, cylinderTypeId, quantity, customerId, notes } = params;

  let { documents: invDocs } = await db.listDocuments(
    IDs.database,
    IDs.inventory,
    [
      Query.equal('userId', userId),
      Query.equal('cylinderTypeId', cylinderTypeId),
      Query.limit(1),
    ]
  );
  let invDoc = invDocs[0];
  
  // Auto-create inventory if it doesn't exist
  if (!invDoc) {
    const newInvId = ID.unique();
    await db.createDocument(IDs.database, IDs.inventory, newInvId, {
      userId,
      cylinderTypeId,
      full: 0,
      empty: 0,
      damaged: 0,
    });
    invDoc = await db.getDocument(IDs.database, IDs.inventory, newInvId);
  }
  
  const inventory = {
    id: invDoc.$id,
    full: Number(invDoc.full ?? 0),
    empty: Number(invDoc.empty ?? 0),
    damaged: Number(invDoc.damaged ?? 0),
  };

  let owed: { id: string; quantity: number } | null = null;
  if ((type === 'loan' || type === 'return') && customerId) {
    const { documents: owedDocs } = await db.listDocuments(
      IDs.database,
      IDs.customer_owed,
      [
        Query.equal('userId', userId),
        Query.equal('customerId', customerId),
        Query.equal('cylinderTypeId', cylinderTypeId),
        Query.limit(1),
      ]
    );
    const o = owedDocs[0];
    if (o) owed = { id: o.$id, quantity: Number(o.quantity ?? 0) };
  }

  return executeMovement({
    userId,
    type,
    cylinderTypeId,
    quantity,
    customerId,
    notes,
    inventory,
    owed,
  });
}

export function useMovements() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const create = useMutation({
    mutationFn: (params: CreateMovementParams) =>
      createMovement(user?.id ?? '', params),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.movements });
      qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
      qc.invalidateQueries({ queryKey: queryKeys.inventory.byType(variables.cylinderTypeId) });
      qc.invalidateQueries({ queryKey: queryKeys.owed });
    },
  });

  return { create };
}
