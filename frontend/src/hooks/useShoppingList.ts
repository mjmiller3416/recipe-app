"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shoppingApi, plannerApi } from "@/lib/api";
import type {
  ShoppingListResponseDTO,
  ShoppingItemResponseDTO,
  ManualItemCreateDTO,
  IngredientBreakdownDTO,
} from "@/types";

// Query keys for cache management
export const shoppingQueryKeys = {
  all: ["shopping"] as const,
  list: () => [...shoppingQueryKeys.all, "list"] as const,
  breakdown: (recipeIds: number[]) =>
    [...shoppingQueryKeys.all, "breakdown", recipeIds.sort().join(",")] as const,
};

/**
 * Hook to fetch shopping list with auto-generation from planner.
 * Uses the combined endpoint to reduce API calls.
 */
export function useShoppingList() {
  return useQuery({
    queryKey: shoppingQueryKeys.list(),
    queryFn: () => shoppingApi.getList(undefined, true), // auto_generate=true
    staleTime: 0, // Always fresh
  });
}

/**
 * Hook to fetch ingredient breakdown for tooltips.
 * Only fetches if recipeIds are provided.
 */
export function useIngredientBreakdown(recipeIds: number[]) {
  return useQuery({
    queryKey: shoppingQueryKeys.breakdown(recipeIds),
    queryFn: () => shoppingApi.getBreakdown(recipeIds),
    enabled: recipeIds.length > 0,
    staleTime: 30000, // Cache breakdown for 30 seconds (less volatile)
  });
}

/**
 * Hook to toggle item's "have" status with optimistic updates.
 */
export function useToggleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => shoppingApi.toggleItem(itemId),

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

    // Dispatch event for sidebar sync (preserves existing behavior)
    onSettled: () => {
      window.dispatchEvent(new Event("shopping-list-updated"));
    },
  });
}

/**
 * Hook to toggle item's "flagged" status with optimistic updates.
 */
export function useToggleFlagged() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => shoppingApi.toggleFlagged(itemId),

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
 * Hook to add a manual item.
 */
export function useAddManualItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ManualItemCreateDTO) => shoppingApi.addItem(data),

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
 * Hook to delete a shopping item.
 */
export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => shoppingApi.deleteItem(itemId),

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
 * Hook to clear manual items.
 */
export function useClearManualItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => shoppingApi.clearManual(),

    onSuccess: () => {
      // Refetch the list after clearing
      queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.list() });
      window.dispatchEvent(new Event("shopping-list-updated"));
    },
  });
}

/**
 * Hook to clear completed items.
 */
export function useClearCompletedItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => shoppingApi.clearCompleted(),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.list() });
      window.dispatchEvent(new Event("shopping-list-updated"));
    },
  });
}

/**
 * Hook to manually refresh the shopping list.
 */
export function useRefreshShoppingList() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: shoppingQueryKeys.list() });
  };
}
