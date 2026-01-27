/**
 * useOwed — list owed from customer_owed, grouped by customer and cylinder type.
 * ISSUE 018: Returns list grouped by customer and cylinder type, zero-quantity hidden.
 */

import { useQuery } from '@tanstack/react-query';
import { Query } from 'appwrite';
import { db, IDs } from '@/lib/appwrite';
import { queryKeys } from '@/lib/queryKeys';
import { fromAppwriteOwed, type OwedRecord } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

async function fetchOwed(userId: string): Promise<OwedRecord[]> {
  const { documents } = await db.listDocuments(IDs.database, IDs.customer_owed, [
    Query.equal('userId', userId),
  ]);
  return documents
    .map((d) => fromAppwriteOwed(d))
    .filter((r) => r.quantity > 0);
}

export type OwedByCustomer = {
  customerId: string;
  records: OwedRecord[];
};

/**
 * Group owed records by customerId. Each group has customerId and records (per cylinder type).
 */
function groupByCustomer(records: OwedRecord[]): OwedByCustomer[] {
  const byCustomer = new Map<string, OwedRecord[]>();
  for (const r of records) {
    const arr = byCustomer.get(r.customerId) ?? [];
    arr.push(r);
    byCustomer.set(r.customerId, arr);
  }
  return Array.from(byCustomer.entries()).map(([customerId, records]) => ({
    customerId,
    records,
  }));
}

export function useOwed() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.owed,
    queryFn: () => fetchOwed(user?.id ?? ''),
    enabled: !!user?.id,
  });

  const list = query.data ?? [];
  const byCustomer = groupByCustomer(list);

  return {
    list,
    byCustomer,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
