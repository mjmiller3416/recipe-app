// src/hooks/api/useUnits.ts
// React Query hooks for unit constants

import { useQuery } from "@tanstack/react-query";
import { unitConversionApi } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import type { UnitsResponseDTO } from "@/types";

/**
 * Hook to fetch all available ingredient units from the backend
 *
 * @returns Query result with units data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useUnits();
 *
 * if (isLoading) return <div>Loading units...</div>;
 * if (error) return <div>Error loading units</div>;
 *
 * return (
 *   <Select>
 *     {data?.units.map(unit => (
 *       <SelectItem key={unit.value} value={unit.value}>
 *         {unit.label}
 *       </SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function useUnits() {
  const { getToken } = useAuth();

  return useQuery<UnitsResponseDTO>({
    queryKey: ["units"],
    queryFn: async () => {
      const token = await getToken();
      return unitConversionApi.getUnits(token);
    },
    staleTime: 1000 * 60 * 60, // 1 hour - units rarely change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours in cache
  });
}
