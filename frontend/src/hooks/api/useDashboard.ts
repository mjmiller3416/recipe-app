"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { dashboardApi } from "@/lib/api";
import { dashboardQueryKeys } from "./queryKeys";

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch dashboard statistics (recipe counts, meals planned, shopping items).
 * This is a lightweight endpoint optimized for dashboard display.
 */
export function useDashboardStats() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: async () => {
      const token = await getToken();
      return dashboardApi.getStats(token);
    },
    staleTime: 30000, // 30 seconds - stats change when data is modified
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Manually refresh dashboard statistics.
 * Useful when you know data has changed and want immediate updates.
 */
export function useRefreshDashboardStats() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.stats() });
  };
}
