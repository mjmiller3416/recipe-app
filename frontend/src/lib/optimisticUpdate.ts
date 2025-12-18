/**
 * Generic optimistic update pattern with automatic rollback on error
 *
 * This utility helps implement optimistic UI updates that:
 * 1. Apply changes immediately for responsive UX
 * 2. Make the actual API call in the background
 * 3. Automatically rollback if the API call fails
 */

export interface OptimisticUpdateOptions<T> {
  /** Function to apply the optimistic update */
  optimisticFn: () => void;
  /** Async function that makes the actual API call */
  apiFn: () => Promise<T>;
  /** Function to rollback the optimistic update on error */
  rollbackFn: () => void;
  /** Optional callback for errors */
  onError?: (error: Error) => void;
  /** Optional callback for success */
  onSuccess?: (result: T) => void;
}

/**
 * Execute an optimistic update with automatic rollback
 *
 * @param options - Configuration for the optimistic update
 * @returns The result of the API call, or null on error
 *
 * @example
 * ```tsx
 * const handleToggleFavorite = async (recipeId: number) => {
 *   const recipe = recipes.find(r => r.id === recipeId);
 *   if (!recipe) return;
 *
 *   await optimisticUpdate({
 *     optimisticFn: () => {
 *       setRecipes(prev => prev.map(r =>
 *         r.id === recipeId ? { ...r, is_favorite: !r.is_favorite } : r
 *       ));
 *     },
 *     apiFn: () => recipeApi.toggleFavorite(recipeId),
 *     rollbackFn: () => {
 *       setRecipes(prev => prev.map(r =>
 *         r.id === recipeId ? { ...r, is_favorite: recipe.is_favorite } : r
 *       ));
 *     },
 *     onError: (error) => toast.error('Failed to update favorite'),
 *   });
 * };
 * ```
 */
export async function optimisticUpdate<T>({
  optimisticFn,
  apiFn,
  rollbackFn,
  onError,
  onSuccess,
}: OptimisticUpdateOptions<T>): Promise<T | null> {
  // Apply optimistic update immediately
  optimisticFn();

  try {
    // Make the actual API call
    const result = await apiFn();
    onSuccess?.(result);
    return result;
  } catch (error) {
    // Rollback on error
    rollbackFn();

    // Handle error
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    onError?.(errorInstance);

    return null;
  }
}

/**
 * Create a reusable optimistic updater for a specific pattern
 *
 * @example
 * ```tsx
 * const toggleFavorite = createOptimisticUpdater<Recipe, boolean>({
 *   getOptimistic: (recipe) => ({ ...recipe, is_favorite: !recipe.is_favorite }),
 *   getOriginal: (recipe) => ({ ...recipe }),
 * });
 *
 * // Usage
 * await toggleFavorite.execute({
 *   item: recipe,
 *   updateState: (updater) => setRecipes(prev => prev.map(r =>
 *     r.id === recipe.id ? updater(r) : r
 *   )),
 *   apiFn: () => api.toggleFavorite(recipe.id),
 * });
 * ```
 */
export function createOptimisticUpdater<TItem, TResult = void>(config: {
  getOptimistic: (item: TItem) => TItem;
  getOriginal: (item: TItem) => TItem;
}) {
  return {
    execute: async (options: {
      item: TItem;
      updateState: (updater: (item: TItem) => TItem) => void;
      apiFn: () => Promise<TResult>;
      onError?: (error: Error) => void;
      onSuccess?: (result: TResult) => void;
    }): Promise<TResult | null> => {
      const { item, updateState, apiFn, onError, onSuccess } = options;
      const originalItem = config.getOriginal(item);

      return optimisticUpdate({
        optimisticFn: () => updateState(config.getOptimistic),
        apiFn,
        rollbackFn: () => updateState(() => originalItem),
        onError,
        onSuccess,
      });
    },
  };
}

/**
 * Helper for optimistic list updates (add/remove/update items)
 */
export const listOptimistic = {
  /**
   * Optimistically add an item to a list
   */
  add: async <T extends { id: number | string }>(options: {
    item: T;
    setList: React.Dispatch<React.SetStateAction<T[]>>;
    apiFn: () => Promise<T>;
    onError?: (error: Error) => void;
    onSuccess?: (result: T) => void;
  }): Promise<T | null> => {
    const { item, setList, apiFn, onError, onSuccess } = options;
    const tempId = item.id;

    return optimisticUpdate({
      optimisticFn: () => setList((prev) => [...prev, item]),
      apiFn,
      rollbackFn: () => setList((prev) => prev.filter((i) => i.id !== tempId)),
      onError,
      onSuccess: (result) => {
        // Replace temp item with real item from API
        setList((prev) =>
          prev.map((i) => (i.id === tempId ? result : i))
        );
        onSuccess?.(result);
      },
    });
  },

  /**
   * Optimistically remove an item from a list
   */
  remove: async <T extends { id: number | string }>(options: {
    id: number | string;
    getList: () => T[];
    setList: React.Dispatch<React.SetStateAction<T[]>>;
    apiFn: () => Promise<void>;
    onError?: (error: Error) => void;
    onSuccess?: () => void;
  }): Promise<void | null> => {
    const { id, getList, setList, apiFn, onError, onSuccess } = options;
    const originalList = getList();

    return optimisticUpdate({
      optimisticFn: () => setList((prev) => prev.filter((i) => i.id !== id)),
      apiFn,
      rollbackFn: () => setList(originalList),
      onError,
      onSuccess,
    });
  },

  /**
   * Optimistically update an item in a list
   */
  update: async <T extends { id: number | string }>(options: {
    id: number | string;
    updates: Partial<T>;
    getList: () => T[];
    setList: React.Dispatch<React.SetStateAction<T[]>>;
    apiFn: () => Promise<T>;
    onError?: (error: Error) => void;
    onSuccess?: (result: T) => void;
  }): Promise<T | null> => {
    const { id, updates, getList, setList, apiFn, onError, onSuccess } = options;
    const originalList = getList();

    return optimisticUpdate({
      optimisticFn: () =>
        setList((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
        ),
      apiFn,
      rollbackFn: () => setList(originalList),
      onError,
      onSuccess: (result) => {
        // Replace with actual result from API
        setList((prev) => prev.map((i) => (i.id === id ? result : i)));
        onSuccess?.(result);
      },
    });
  },

  /**
   * Optimistically toggle a boolean field
   */
  toggle: async <T extends { id: number | string }>(options: {
    id: number | string;
    field: keyof T;
    getList: () => T[];
    setList: React.Dispatch<React.SetStateAction<T[]>>;
    apiFn: () => Promise<T>;
    onError?: (error: Error) => void;
    onSuccess?: (result: T) => void;
  }): Promise<T | null> => {
    const { id, field, getList, setList, apiFn, onError, onSuccess } = options;
    const originalList = getList();
    const item = originalList.find((i) => i.id === id);
    if (!item) return null;

    return optimisticUpdate({
      optimisticFn: () =>
        setList((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, [field]: !i[field] } : i
          )
        ),
      apiFn,
      rollbackFn: () => setList(originalList),
      onError,
      onSuccess,
    });
  },
};

// Type import for React
import type React from "react";