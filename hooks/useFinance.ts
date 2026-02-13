/**
 * useFinance — create transactions, manage customer balances, fetch outstanding & summary.
 * F06: createTransaction, applyBalanceDelta, getOutstandingBalances, getSummaryTotals.
 * Rules: sale_credit → balance += amount; payment → balance -= amount (block if < 0).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID, Query } from 'appwrite';
import { db, IDs } from '@/lib/appwrite';
import { queryKeys } from '@/lib/queryKeys';
import {
  fromAppwriteFinanceTransaction,
  fromAppwriteCustomerBalance,
  type FinanceTransaction,
  type FinanceTransactionType,
  type CustomerBalance,
} from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export type CreateTransactionParams = {
  type: FinanceTransactionType;
  amount: number;
  customerId?: string;
  movementId?: string;
  notes?: string;
};

export type SummaryTotals = {
  sales: number;
  payments: number;
  refills: number;
  expenses: number;
  adds: number;
};

export type DateRange = { start: string; end: string };

async function fetchOutstanding(userId: string): Promise<CustomerBalance[]> {
  const { documents } = await db.listDocuments(IDs.database, IDs.customer_balance, [
    Query.equal('userId', userId),
  ]);
  return documents
    .map((d) => fromAppwriteCustomerBalance(d))
    .filter((b) => b.balance > 0);
}

const SUMMARY_PAGE_SIZE = 500;

async function fetchSummaryInRange(
  userId: string,
  start: string,
  end: string
): Promise<SummaryTotals> {
  const totals: SummaryTotals = { sales: 0, payments: 0, refills: 0, expenses: 0, adds: 0 };
  let offset = 0;

  while (true) {
    const { documents } = await db.listDocuments(IDs.database, IDs.finance_transactions, [
      Query.equal('userId', userId),
      Query.greaterThanEqual('createdAt', start),
      Query.lessThanEqual('createdAt', end),
      Query.orderAsc('createdAt'),
      Query.limit(SUMMARY_PAGE_SIZE),
      Query.offset(offset),
    ]);
    for (const d of documents) {
      const t = fromAppwriteFinanceTransaction(d);
      switch (t.type) {
        case 'sale_cash':
        case 'sale_credit':
          totals.sales += t.amount;
          break;
        case 'payment':
          totals.payments += t.amount;
          break;
        case 'refill':
          totals.refills += t.amount;
          break;
        case 'expense':
          totals.expenses += t.amount;
          break;
        case 'add':
          totals.adds += t.amount;
          break;
      }
    }
    if (documents.length < SUMMARY_PAGE_SIZE) break;
    offset += documents.length;
  }
  return totals;
}

async function findBalanceDoc(
  userId: string,
  customerId: string
): Promise<{ id: string; balance: number } | null> {
  const { documents } = await db.listDocuments(IDs.database, IDs.customer_balance, [
    Query.equal('userId', userId),
    Query.equal('customerId', customerId),
    Query.limit(1),
  ]);
  const d = documents[0];
  if (!d) return null;
  return { id: d.$id, balance: Number(d.balance ?? 0) };
}

async function applyBalanceDelta(
  userId: string,
  customerId: string,
  delta: number
): Promise<void> {
  const existing = await findBalanceDoc(userId, customerId);
  const current = existing?.balance ?? 0;
  const next = current + delta;

  if (next < 0) {
    throw new Error(
      `Cannot apply payment: balance would go negative (current: ${current}, payment: ${-delta}). Pay at most ${current}.`
    );
  }

  if (existing) {
    if (next === 0) {
      await db.deleteDocument(IDs.database, IDs.customer_balance, existing.id);
    } else {
      await db.updateDocument(IDs.database, IDs.customer_balance, existing.id, {
        balance: next,
      });
    }
  } else {
    if (delta <= 0) {
      throw new Error('Cannot apply payment: customer has no outstanding balance.');
    }
    await db.createDocument(IDs.database, IDs.customer_balance, ID.unique(), {
      userId,
      customerId,
      balance: delta,
    });
  }
}

async function createTransaction(
  userId: string,
  params: CreateTransactionParams
): Promise<{ transactionId: string }> {
  const { type, amount, customerId, movementId, notes } = params;

  if (type === 'sale_credit' || type === 'payment') {
    if (!customerId) {
      throw new Error('customerId is required for sale_credit and payment.');
    }
  }

  if (type === 'payment') {
    const existing = await findBalanceDoc(userId, customerId!);
    const balance = existing?.balance ?? 0;
    if (amount > balance) {
      throw new Error(
        `Payment amount (${amount}) exceeds outstanding balance (${balance}). Pay at most ${balance}.`
      );
    }
  }

  const txId = ID.unique();
  const data: Record<string, string | number> = {
    userId,
    type,
    amount,
    createdAt: new Date().toISOString(),
  };
  if (customerId != null) data.customerId = customerId;
  if (movementId != null) data.movementId = movementId;
  if (notes != null) data.notes = notes;

  await db.createDocument(IDs.database, IDs.finance_transactions, txId, data);

  try {
    if (type === 'sale_credit' && customerId) {
      await applyBalanceDelta(userId, customerId, amount);
    }
    if (type === 'payment' && customerId) {
      await applyBalanceDelta(userId, customerId, -amount);
    }
  } catch (e) {
    try {
      await db.deleteDocument(IDs.database, IDs.finance_transactions, txId);
    } catch (rb) {
      console.warn('[useFinance] rollback: delete tx after balance update failure', rb);
    }
    throw e;
  }

  return { transactionId: txId };
}

export function useFinance() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const create = useMutation({
    mutationFn: (params: CreateTransactionParams) =>
      createTransaction(user?.id ?? '', params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.finance.outstanding });
      qc.invalidateQueries({ queryKey: ['finance'] });
      qc.invalidateQueries({ queryKey: queryKeys.movements }); // Invalidate history to show payments
    },
  });

  const outstandingQuery = useQuery({
    queryKey: queryKeys.finance.outstanding,
    queryFn: () => fetchOutstanding(user?.id ?? ''),
    enabled: !!user?.id,
  });

  const outstanding = outstandingQuery.data ?? [];

  const getOutstandingBalances = (): CustomerBalance[] => outstanding;

  /** Balance for a customer (0 if not in outstanding). */
  const getBalanceForCustomer = (customerId: string): number =>
    outstanding.find((b) => b.customerId === customerId)?.balance ?? 0;

  return {
    createTransaction: create.mutateAsync,
    create,
    getOutstandingBalances,
    getBalanceForCustomer,
    outstanding,
    outstandingLoading: outstandingQuery.isLoading,
    outstandingError: outstandingQuery.isError,
    outstandingErrorDetail: outstandingQuery.error,
    outstandingRefetch: outstandingQuery.refetch,
  };
}

export function useSummaryTotals(range: DateRange | null) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: range
      ? queryKeys.finance.summary(range.start, range.end)
      : (['finance', 'summary', 'skip'] as const),
    queryFn: () => fetchSummaryInRange(user!.id, range!.start, range!.end),
    enabled: !!user?.id && !!range?.start && !!range?.end,
  });

  const totals = query.data ?? {
    sales: 0,
    payments: 0,
    refills: 0,
    expenses: 0,
    adds: 0,
  };

  const getSummaryTotals = (): SummaryTotals => totals;

  return {
    getSummaryTotals,
    totals,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
