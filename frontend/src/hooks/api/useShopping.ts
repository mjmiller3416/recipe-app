"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { shoppingApi } from "@/lib/api";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const shoppingQueryKeys = {
  all: ["shopping"] as const,
  list: () => [...shoppingQueryKeys.all, "list"] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch the shopping list with item counts.
 * Used by Dashboard widget and Sidebar badge.
 */
export function useShoppingList() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: shoppingQueryKeys.list(),
    queryFn: async () => {
      const token = await getToken();
      return shoppingApi.getList(undefined, false, token);
    },
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Generate shopping list from planner.
 * Invalidates shopping list cache on success.
 */
export function useGenerateShoppingList() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return shoppingApi.generateFromPlanner(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.list() });
    },
  });
}

/**
 * Toggle a shopping item's "have" status.
 */
export function useToggleShoppingItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: number) => {
      const token = await getToken();
      return shoppingApi.toggleItem(itemId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.list() });
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Manually refresh the shopping list.
 */
export function useRefreshShoppingList() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.list() });
  };
}
