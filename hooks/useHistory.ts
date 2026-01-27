/**
 * useHistory — timeline list of movements and finance transactions, newest-first.
 * ISSUE 019: Lists movements newest-first. Simple filters supported later (not required now).
 */

import { useQuery } from '@tanstack/react-query';
import { Query } from 'appwrite';
import { db, IDs } from '@/lib/appwrite';
import { queryKeys } from '@/lib/queryKeys';
import {
  fromAppwriteMovement,
  fromAppwriteFinanceTransaction,
  type Movement,
  type FinanceTransaction,
} from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

const HISTORY_LIMIT = 200;

export type HistoryItem =
  | { type: 'movement'; data: Movement; transaction?: FinanceTransaction | null }
  | { type: 'transaction'; data: FinanceTransaction; movement?: Movement | null };

async function fetchHistory(userId: string): Promise<HistoryItem[]> {
  const [movementsResult, financeResult] = await Promise.all([
    db.listDocuments(IDs.database, IDs.movements, [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
      Query.limit(HISTORY_LIMIT),
    ]),
    db.listDocuments(IDs.database, IDs.finance_transactions, [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
      Query.limit(HISTORY_LIMIT),
    ]),
  ]);

  // Normalize movements into a map for easy lookup when linked from finance transactions
  const movementList: Movement[] = movementsResult.documents.map((d) => fromAppwriteMovement(d));
  const movementById = new Map<string, Movement>(movementList.map((m) => [m.id, m]));
  const usedMovementIds = new Set<string>();

  const items: HistoryItem[] = [];

  // First, build history items from finance transactions, attaching a linked movement when present.
  for (const d of financeResult.documents) {
    const tx = fromAppwriteFinanceTransaction(d);
    let linkedMovement: Movement | null = null;
    if (tx.movementId) {
      const m = movementById.get(tx.movementId);
      if (m) {
        linkedMovement = m;
        usedMovementIds.add(m.id);
      }
    }
    items.push({
      type: 'transaction',
      data: tx,
      movement: linkedMovement ?? undefined,
    });
  }

  // Then, include standalone movements that are not linked to any finance transaction.
  for (const m of movementList) {
    if (!usedMovementIds.has(m.id)) {
      items.push({
        type: 'movement',
        data: m,
      });
    }
  }

  items.sort((a, b) => {
    const dateA = a.type === 'movement' ? a.data.createdAt : a.data.createdAt;
    const dateB = b.type === 'movement' ? b.data.createdAt : b.data.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return items.slice(0, HISTORY_LIMIT);
}

export function useHistory() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.movements,
    queryFn: () => fetchHistory(user?.id ?? ''),
    enabled: !!user?.id,
  });

  return {
    items: query.data ?? [],
    movements: (query.data ?? []).filter((i) => i.type === 'movement').map((i) => i.data),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
