/**
 * useCylinderTypes — read-only access to cylinder types.
 * Everyone can view cylinder types (no create/delete needed).
 */

import { useQuery } from '@tanstack/react-query';
import { db, IDs } from '@/lib/appwrite';
import { queryKeys } from '@/lib/queryKeys';
import { fromAppwriteCylinderType, type CylinderType } from '@/lib/types';

async function fetchCylinderTypes(): Promise<CylinderType[]> {
  const { documents } = await db.listDocuments(IDs.database, IDs.cylinder_types);
  return documents.map((d) => fromAppwriteCylinderType(d));
}

export function useCylinderTypes() {
  const query = useQuery({
    queryKey: queryKeys.cylinderTypes.all,
    queryFn: fetchCylinderTypes,
  });

  return {
    cylinderTypes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
