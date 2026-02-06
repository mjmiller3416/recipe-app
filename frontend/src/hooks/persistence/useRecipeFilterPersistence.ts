"use client";

import { useCallback } from "react";
import type { FilterState } from "@/app/recipes/_components/browser/RecipeFilters";
import type {
  SortOption,
  SortDirection,
} from "@/app/recipes/_components/browser/RecipeSortControls";

// ============================================================================
// Types
// ============================================================================

export interface SavedRecipeFilterState {
  filters: FilterState;
  searchTerm: string;
  activeQuickFilters: string[];
  sortBy: SortOption;
  sortDirection: SortDirection;
  timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "recipe-browser-filter-state";
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// Hook
// ============================================================================

interface UseRecipeFilterPersistenceReturn {
  /**
   * Save current filter state to sessionStorage
   */
  saveFilterState: (state: Omit<SavedRecipeFilterState, "timestamp">) => void;
  /**
   * Load saved filter state from sessionStorage (returns null if none or stale)
   */
  loadFilterState: () => SavedRecipeFilterState | null;
  /**
   * Clear saved filter state
   */
  clearFilterState: () => void;
}

/**
 * Hook for persisting recipe filter state across back navigation.
 *
 * Uses sessionStorage so state persists within a browser tab session
 * but resets when the tab is closed or on fresh navigation.
 *
 * @example
 * ```tsx
 * const { saveFilterState, loadFilterState, clearFilterState } = useRecipeFilterPersistence();
 *
 * // On click recipe
 * saveFilterState({ filters, searchTerm, activeQuickFilters, sortBy, sortDirection });
 *
 * // On mount - restore if available
 * const saved = loadFilterState();
 * if (saved) {
 *   setFilters(saved.filters);
 *   clearFilterState(); // Prevent stale restoration
 * }
 * ```
 */
export function useRecipeFilterPersistence(): UseRecipeFilterPersistenceReturn {
  const saveFilterState = useCallback(
    (state: Omit<SavedRecipeFilterState, "timestamp">) => {
      try {
        const toSave: SavedRecipeFilterState = {
          ...state,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error("[useRecipeFilterPersistence] Failed to save:", error);
      }
    },
    []
  );

  const loadFilterState = useCallback((): SavedRecipeFilterState | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as SavedRecipeFilterState;

      // Check for staleness
      const age = Date.now() - parsed.timestamp;
      if (age > MAX_AGE_MS) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("[useRecipeFilterPersistence] Failed to load:", error);
      return null;
    }
  }, []);

  const clearFilterState = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("[useRecipeFilterPersistence] Failed to clear:", error);
    }
  }, []);

  return {
    saveFilterState,
    loadFilterState,
    clearFilterState,
  };
}
