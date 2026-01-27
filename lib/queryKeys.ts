/**
 * TanStack Query keys for consistent cache invalidation.
 */

export const queryKeys = {
  customers: {
    all: ['customers'] as const,
    detail: (id: string) => ['customers', id] as const,
  },
  cylinderTypes: {
    all: ['cylinderTypes'] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    byType: (cylinderTypeId: string) => ['inventory', cylinderTypeId] as const,
  },
  movements: ['movements'] as const,
  owed: ['owed'] as const,
  prices: {
    all: ['prices'] as const,
    history: (cylinderTypeId: string) => ['prices', 'history', cylinderTypeId] as const,
  },
  finance: {
    outstanding: ['finance', 'outstanding'] as const,
    summary: (start: string, end: string) => ['finance', 'summary', start, end] as const,
  },
} as const;
