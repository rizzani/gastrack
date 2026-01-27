/**
 * usePrices — fetch current sell/refill prices + history per cylinder type.
 * F05: getCurrentPrices (map by cylinderTypeId), getPriceHistory, getCurrentPriceForType.
 * F10: createPriceRecord for new refill unit cost.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { db, IDs } from '@/lib/appwrite';
import { queryKeys } from '@/lib/queryKeys';
import { fromAppwritePrice, type PriceRecord } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export type CreatePriceParams = {
  cylinderTypeId: string;
  sellUnitPrice: number;
  refillUnitCost: number;
  notes?: string;
};

async function createPriceRecord(userId: string, params: CreatePriceParams): Promise<{ id: string }> {
  const { cylinderTypeId, sellUnitPrice, refillUnitCost, notes } = params;
  const id = ID.unique();
  const data: Record<string, string | number> = {
    userId,
    cylinderTypeId,
    sellUnitPrice,
    refillUnitCost,
    effectiveFrom: new Date().toISOString(),
  };
  if (notes != null) data.notes = notes;
  await db.createDocument(IDs.database, IDs.prices, id, data);
  return { id };
}

async function fetchAllPrices(userId: string): Promise<PriceRecord[]> {
  const { documents } = await db.listDocuments(IDs.database, IDs.prices, [
    Query.equal('userId', userId),
    Query.limit(500),
  ]);
  return documents.map((d) => fromAppwritePrice(d));
}

async function fetchPriceHistory(userId: string, cylinderTypeId: string): Promise<PriceRecord[]> {
  const { documents } = await db.listDocuments(IDs.database, IDs.prices, [
    Query.equal('userId', userId),
    Query.equal('cylinderTypeId', cylinderTypeId),
    Query.orderDesc('effectiveFrom'),
    Query.limit(100),
  ]);
  return documents.map((d) => fromAppwritePrice(d));
}

/** Build map of cylinderTypeId -> latest price by effectiveFrom. */
function buildCurrentPricesMap(records: PriceRecord[]): Map<string, PriceRecord> {
  const byType = new Map<string, PriceRecord[]>();
  for (const r of records) {
    const arr = byType.get(r.cylinderTypeId) ?? [];
    arr.push(r);
    byType.set(r.cylinderTypeId, arr);
  }
  const map = new Map<string, PriceRecord>();
  for (const [cylId, arr] of byType) {
    const sorted = [...arr].sort(
      (a, b) => {
        const dateA = new Date(a.effectiveFrom || a.createdAt).getTime();
        const dateB = new Date(b.effectiveFrom || b.createdAt).getTime();
        return dateB - dateA; // Most recent first
      }
    );
    if (sorted.length > 0) {
      map.set(cylId, sorted[0]);
    }
  }
  return map;
}

export function usePrices() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const allQuery = useQuery({
    queryKey: queryKeys.prices.all,
    queryFn: () => fetchAllPrices(user?.id ?? ''),
    enabled: !!user?.id,
  });

  const allPrices = allQuery.data ?? [];
  const currentPricesMap = buildCurrentPricesMap(allPrices);

  const getCurrentPrices = (): Map<string, PriceRecord> => currentPricesMap;
  const getCurrentPriceForType = (cylinderTypeId: string): PriceRecord | undefined =>
    currentPricesMap.get(cylinderTypeId);

  /** Price history for a cylinder type, newest-first. Derived from all prices. */
  const getPriceHistory = (cylinderTypeId: string): PriceRecord[] => {
    const list = allPrices
      .filter((p) => p.cylinderTypeId === cylinderTypeId)
      .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
    return list;
  };

  const createPrice = useMutation({
    mutationFn: (params: CreatePriceParams) =>
      createPriceRecord(user?.id ?? '', params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.prices.all });
      qc.invalidateQueries({ queryKey: ['prices'] });
    },
  });

  return {
    getCurrentPrices,
    getCurrentPriceForType,
    getPriceHistory,
    createPriceRecord: createPrice.mutateAsync,
    createPrice: createPrice,
    currentPricesMap,
    allPrices,
    isLoading: allQuery.isLoading,
    isError: allQuery.isError,
    error: allQuery.error,
    refetch: allQuery.refetch,
  };
}

export function usePriceHistory(cylinderTypeId: string) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.prices.history(cylinderTypeId),
    queryFn: () => fetchPriceHistory(user?.id ?? '', cylinderTypeId),
    enabled: !!user?.id && !!cylinderTypeId,
  });

  const history = query.data ?? [];

  return {
    getPriceHistory: (): PriceRecord[] => history,
    history,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
