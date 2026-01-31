"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { unitConversionApi } from "@/lib/api";
import type { UnitOptionDTO } from "@/types";

/**
 * Hook to fetch all available ingredient units
 *
 * Uses React Query to cache and manage the units list.
 * The units are fetched from the backend which serves as the single source of truth.
 *
 * @returns React Query result with units array
 *
 * @example
 * ```tsx
 * const { data: units = [] } = useUnits();
 * {units.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
 * ```
 */
export function useUnits() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const token = await getToken();
      const response = await unitConversionApi.getUnits(token);
      return response.units;
    },
    staleTime: Infinity, // Units rarely change, so cache indefinitely
  });
}

/**
 * Type export for the unit option
 */
export type { UnitOptionDTO };
