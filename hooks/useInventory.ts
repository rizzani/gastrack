/**
 * useInventory — read by cylinder type + update counts.
 * ISSUE 016: Fetch inventory by cylinder type, update inventory counts.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { db, IDs } from '@/lib/appwrite';
import { queryKeys } from '@/lib/queryKeys';
import { fromAppwriteInventory, type InventoryRecord } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

async function fetchAllInventory(userId: string): Promise<InventoryRecord[]> {
  const { documents } = await db.listDocuments(IDs.database, IDs.inventory, [
    Query.equal('userId', userId),
  ]);
  return documents.map((d) => fromAppwriteInventory(d));
}

async function fetchInventoryByType(
  userId: string,
  cylinderTypeId: string
): Promise<InventoryRecord[]> {
  const { documents } = await db.listDocuments(
    IDs.database,
    IDs.inventory,
    [
      Query.equal('userId', userId),
      Query.equal('cylinderTypeId', cylinderTypeId),
      Query.limit(1),
    ]
  );
  const d = documents[0];
  return d ? [fromAppwriteInventory(d)] : [];
}

export type UpdateInventoryPatch = {
  full?: number;
  empty?: number;
  damaged?: number;
};

async function createOrUpdateInventory(
  userId: string,
  cylinderTypeId: string,
  patch: UpdateInventoryPatch
): Promise<InventoryRecord | null> {
  const { documents } = await db.listDocuments(IDs.database, IDs.inventory, [
    Query.equal('userId', userId),
    Query.equal('cylinderTypeId', cylinderTypeId),
    Query.limit(1),
  ]);
  let doc = documents[0];
  
  // Create inventory if it doesn't exist
  if (!doc) {
    const full = patch.full ?? 0;
    const empty = patch.empty ?? 0;
    const damaged = patch.damaged ?? 0;
    
    // Don't create inventory if all values are 0
    if (full === 0 && empty === 0 && damaged === 0) {
      return null;
    }
    
    const newInvId = ID.unique();
    await db.createDocument(IDs.database, IDs.inventory, newInvId, {
      userId,
      cylinderTypeId,
      full,
      empty,
      damaged,
    });
    doc = await db.getDocument(IDs.database, IDs.inventory, newInvId);
    return fromAppwriteInventory(doc);
  }
  
  // Update existing inventory
  const current = fromAppwriteInventory(doc);
  const data: Record<string, number> = {};
  if (patch.full !== undefined) data.full = patch.full;
  if (patch.empty !== undefined) data.empty = patch.empty;
  if (patch.damaged !== undefined) data.damaged = patch.damaged;
  
  // Calculate final values after update
  const finalFull = patch.full !== undefined ? patch.full : current.full;
  const finalEmpty = patch.empty !== undefined ? patch.empty : current.empty;
  const finalDamaged = patch.damaged !== undefined ? patch.damaged : current.damaged;
  
  // If all values will be 0, delete the inventory item
  if (finalFull === 0 && finalEmpty === 0 && finalDamaged === 0) {
    await db.deleteDocument(IDs.database, IDs.inventory, doc.$id);
    return null;
  }
  
  if (Object.keys(data).length === 0) {
    return current;
  }
  
  const updated = await db.updateDocument(
    IDs.database,
    IDs.inventory,
    doc.$id,
    data
  );
  return fromAppwriteInventory(updated);
}

export function useInventory(cylinderTypeId?: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const queryKey = cylinderTypeId
    ? queryKeys.inventory.byType(cylinderTypeId)
    : queryKeys.inventory.all;
  const queryFn = cylinderTypeId
    ? () => fetchInventoryByType(user?.id ?? '', cylinderTypeId)
    : () => fetchAllInventory(user?.id ?? '');

  const query = useQuery({
    queryKey,
    queryFn,
    enabled: !!user?.id,
  });

  const list: InventoryRecord[] = query.data ?? [];
  const record = cylinderTypeId ? list[0] : undefined;

  const update = useMutation({
    mutationFn: (patch: UpdateInventoryPatch) =>
      createOrUpdateInventory(user?.id ?? '', cylinderTypeId!, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
      if (cylinderTypeId) {
        qc.invalidateQueries({ queryKey: queryKeys.inventory.byType(cylinderTypeId) });
      }
    },
  });
  
  const createOrUpdate = useMutation({
    mutationFn: ({ cylinderTypeId: typeId, patch }: { cylinderTypeId: string; patch: UpdateInventoryPatch }) =>
      createOrUpdateInventory(user?.id ?? '', typeId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });

  return {
    list,
    record,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    update: cylinderTypeId ? update : null,
    createOrUpdate,
  };
}
