"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { shoppingApi } from "@/lib/api";
import type {
  ShoppingListResponseDTO,
  ManualItemCreateDTO,
} from "@/types/shopping";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const shoppingQueryKeys = {
  all: ["shopping"] as const,
  list: () => [...shoppingQueryKeys.all, "list"] as const,
  breakdown: (recipeIds: number[]) =>
    [...shoppingQueryKeys.all, "breakdown", recipeIds.sort().join(",")] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch the shopping list.
 * Shopping list is automatically synced when planner changes occur.
 */
export function useShoppingList() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: shoppingQueryKeys.list(),
    queryFn: async () => {
      const token = await getToken();
      return shoppingApi.getList(undefined, token);
    },
    staleTime: 0, // Always fresh - shopping list changes frequently
    enabled: isLoaded && isSignedIn, // Only fetch when auth is ready
  });
}

/**
 * Hook to fetch ingredient breakdown for tooltips.
 * Only fetches if recipeIds are provided.
 */
export function useIngredientBreakdown(recipeIds: number[]) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: shoppingQueryKeys.breakdown(recipeIds),
    queryFn: async () => {
      const token = await getToken();
      return shoppingApi.getBreakdown(recipeIds, token);
    },
    enabled: isLoaded && isSignedIn && recipeIds.length > 0,
    staleTime: 30000, // Cache breakdown for 30 seconds (less volatile)
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Toggle item's "have" status with optimistic updates.
 */
export function useToggleItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: number) => {
      const token = await getToken();
      return shoppingApi.toggleItem(itemId, token);
    },

    // Optimistic update
    onMutate: async (itemId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: shoppingQueryKeys.list() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ShoppingListResponseDTO>(
        shoppingQueryKeys.list()
      );

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<ShoppingListResponseDTO>(
          shoppingQueryKeys.list(),
          {
            ...previousData,
            items: previousData.items.map((item) =>
              item.id === itemId ? { ...item, have: !item.have } : item
            ),
            checked_items: previousData.items.find((i) => i.id === itemId)?.have
              ? previousData.checked_items - 1
              : previousData.checked_items + 1,
          }
        );
      }

      // Return context for rollback
      return { previousData };
    },

    // Rollback on error
    onError: (_err, _itemId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(shoppingQueryKeys.list(), context.previousData);
      }
    },

    // Dispatch event for sidebar sync
    onSettled: () => {
      window.dispatchEvent(new Event("shopping-list-updated"));
    },
  });
}

/**
 * Toggle item's "flagged" status with optimistic updates.
 */
export function useToggleFlagged() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: number) => {
      const token = await getToken();
      return shoppingApi.toggleFlagged(itemId, token);
    },

    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: shoppingQueryKeys.list() });

      const previousData = queryClient.getQueryData<ShoppingListResponseDTO>(
        shoppingQueryKeys.list()
      );

      if (previousData) {
        queryClient.setQueryData<ShoppingListResponseDTO>(
          shoppingQueryKeys.list(),
          {
            ...previousData,
            items: previousData.items.map((item) =>
              item.id === itemId ? { ...item, flagged: !item.flagged } : item
            ),
          }
        );
      }

      return { previousData };
    },

    onError: (_err, _itemId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(shoppingQueryKeys.list(), context.previousData);
      }
    },
  });
}

/**
 * Add a manual item.
 */
export function useAddManualItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ManualItemCreateDTO) => {
      const token = await getToken();
      return shoppingApi.addItem(data, token);
    },

    onSuccess: (newItem) => {
      // Add the new item to the cache
      const previousData = queryClient.getQueryData<ShoppingListResponseDTO>(
        shoppingQueryKeys.list()
      );

      if (previousData) {
        queryClient.setQueryData<ShoppingListResponseDTO>(
          shoppingQueryKeys.list(),
          {
            ...previousData,
            items: [...previousData.items, newItem],
            total_items: previousData.total_items + 1,
            manual_items: previousData.manual_items + 1,
          }
        );
      }

      window.dispatchEvent(new Event("shopping-list-updated"));
    },
  });
}

/**
 * Delete a shopping item with optimistic updates.
 */
export function useDeleteItem() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: number) => {
      const token = await getToken();
      return shoppingApi.deleteItem(itemId, token);
    },

    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: shoppingQueryKeys.list() });

      const previousData = queryClient.getQueryData<ShoppingListResponseDTO>(
        shoppingQueryKeys.list()
      );

      if (previousData) {
        const deletedItem = previousData.items.find((i) => i.id === itemId);
        queryClient.setQueryData<ShoppingListResponseDTO>(
          shoppingQueryKeys.list(),
          {
            ...previousData,
            items: previousData.items.filter((item) => item.id !== itemId),
            total_items: previousData.total_items - 1,
            checked_items: deletedItem?.have
              ? previousData.checked_items - 1
              : previousData.checked_items,
            manual_items:
              deletedItem?.source === "manual"
                ? previousData.manual_items - 1
                : previousData.manual_items,
            recipe_items:
              deletedItem?.source === "recipe"
                ? previousData.recipe_items - 1
                : previousData.recipe_items,
          }
        );
      }

      return { previousData };
    },

    onError: (_err, _itemId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(shoppingQueryKeys.list(), context.previousData);
      }
    },

    onSettled: () => {
      window.dispatchEvent(new Event("shopping-list-updated"));
    },
  });
}

/**
 * Clear manual items.
 */
export function useClearManualItems() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return shoppingApi.clearManual(token);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.list() });
      window.dispatchEvent(new Event("shopping-list-updated"));
    },
  });
}

/**
 * Clear completed items.
 */
export function useClearCompletedItems() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return shoppingApi.clearCompleted(token);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.list() });
      window.dispatchEvent(new Event("shopping-list-updated"));
    },
  });
}

/**
 * Generate shopping list from planner.
 * @deprecated Shopping list is now automatically synced when planner changes.
 * This hook is kept for backwards compatibility.
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
      window.dispatchEvent(new Event("shopping-list-updated"));
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
