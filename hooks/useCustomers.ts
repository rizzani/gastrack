/**
 * useCustomers — CRUD for customers.
 * ISSUE 015: List, add, update notes/phone, query caching.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { db, IDs } from '@/lib/appwrite';
import { queryKeys } from '@/lib/queryKeys';
import { fromAppwriteCustomer, type Customer } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

async function fetchCustomers(userId: string): Promise<Customer[]> {
  const { documents } = await db.listDocuments(IDs.database, IDs.customers, [
    Query.equal('userId', userId),
  ]);
  return documents.map((d) => fromAppwriteCustomer(d));
}

async function createCustomer(params: {
  userId: string;
  name: string;
  phone?: string;
  notes?: string;
}): Promise<Customer> {
  const data: Record<string, string> = { 
    userId: params.userId,
    name: params.name 
  };
  if (params.phone != null) data.phone = params.phone;
  if (params.notes != null) data.notes = params.notes;
  const doc = await db.createDocument(
    IDs.database,
    IDs.customers,
    ID.unique(),
    data
  );
  return fromAppwriteCustomer(doc);
}

async function updateCustomer(
  id: string,
  patch: { name?: string; phone?: string; notes?: string }
): Promise<Customer> {
  const data: Record<string, string> = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.phone !== undefined) data.phone = patch.phone;
  if (patch.notes !== undefined) data.notes = patch.notes;
  if (Object.keys(data).length === 0) {
    const doc = await db.getDocument(IDs.database, IDs.customers, id);
    return fromAppwriteCustomer(doc);
  }
  const doc = await db.updateDocument(
    IDs.database,
    IDs.customers,
    id,
    data
  );
  return fromAppwriteCustomer(doc);
}

export function useCustomers() {
  const qc = useQueryClient();
  const { user } = useAuth();
  
  const query = useQuery({
    queryKey: queryKeys.customers.all,
    queryFn: () => fetchCustomers(user?.id ?? ''),
    enabled: !!user?.id,
  });

  const create = useMutation({
    mutationFn: (params: { name: string; phone?: string; notes?: string }) =>
      createCustomer({ ...params, userId: user?.id ?? '' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; phone?: string; notes?: string } }) =>
      updateCustomer(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.customers.all });
      qc.invalidateQueries({ queryKey: queryKeys.customers.detail(id) });
    },
  });

  return {
    customers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    create,
    update,
  };
}
