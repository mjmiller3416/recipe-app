/**
 * Hook for managing recipe filter state with automatic syncing between
 * different filter representations (quick filters, full filters).
 *
 * This hook is optional - components can also use filterUtils directly
 * if they need more control over their state management.
 */

import { useState, useMemo, useCallback } from "react";
import { QUICK_FILTERS } from "@/lib/constants";
import {
  type RecipeFilters,
  type ActiveFilter,
  type FilterOption,
  DEFAULT_FILTERS,
  applyFilters,
  hasActiveFilters,
  getActiveFiltersList,
  removeFilter,
  quickFiltersToRecipeFilters,
} from "@/lib/filterUtils";
import type { RecipeCardData } from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface UseRecipeFiltersOptions {
  /** Initial filter state */
  initialFilters?: Partial<RecipeFilters>;
  /** Callback when filters change */
  onFiltersChange?: (filters: RecipeFilters) => void;
  /** Label mappings for display */
  filterOptions?: {
    categoryOptions?: FilterOption[];
    mealTypeOptions?: FilterOption[];
    dietaryOptions?: FilterOption[];
  };
}

export interface UseRecipeFiltersReturn {
  // State
  filters: RecipeFilters;
  activeQuickFilters: Set<string>;

  // Derived
  hasActiveFilters: boolean;
  activeFiltersList: ActiveFilter[];

  // Actions - Individual filter toggles
  setSearchTerm: (term: string) => void;
  toggleCategory: (value: string) => void;
  toggleMealType: (value: string) => void;
  toggleDietary: (value: string) => void;
  toggleFavorites: () => void;
  setMaxCookTime: (minutes: number | null) => void;
  setNewDays: (days: number | null) => void;

  // Actions - Quick filter support
  toggleQuickFilter: (filterId: string) => void;

  // Actions - Bulk operations
  removeActiveFilter: (filter: ActiveFilter) => void;
  clearAll: () => void;
  setFilters: React.Dispatch<React.SetStateAction<RecipeFilters>>;

  // Filter application
  applyTo: (recipes: RecipeCardData[]) => RecipeCardData[];
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useRecipeFilters(
  options: UseRecipeFiltersOptions = {}
): UseRecipeFiltersReturn {
  const { initialFilters, onFiltersChange, filterOptions } = options;

  // Main filter state
  const [filters, setFiltersInternal] = useState<RecipeFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  // Quick filter state (kept in sync with main filters)
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(
    () => new Set()
  );

  // Wrapped setFilters that also calls onFiltersChange
  const setFilters: React.Dispatch<React.SetStateAction<RecipeFilters>> = useCallback(
    (action) => {
      setFiltersInternal((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        onFiltersChange?.(next);
        return next;
      });
    },
    [onFiltersChange]
  );

  // Derived: Check if any filters are active
  const hasActive = useMemo(() => hasActiveFilters(filters), [filters]);

  // Derived: Build active filters list for display
  const activeFiltersList = useMemo(
    () => getActiveFiltersList(filters, filterOptions),
    [filters, filterOptions]
  );

  // -------------------------------------------------------------------------
  // Individual Filter Actions
  // -------------------------------------------------------------------------

  const setSearchTerm = useCallback(
    (term: string) => {
      setFilters((prev) => ({ ...prev, searchTerm: term }));
    },
    [setFilters]
  );

  const toggleCategory = useCallback(
    (value: string) => {
      setFilters((prev) => ({
        ...prev,
        categories: prev.categories.includes(value)
          ? prev.categories.filter((c) => c !== value)
          : [...prev.categories, value],
      }));
    },
    [setFilters]
  );

  const toggleMealType = useCallback(
    (value: string) => {
      setFilters((prev) => ({
        ...prev,
        mealTypes: prev.mealTypes.includes(value)
          ? prev.mealTypes.filter((m) => m !== value)
          : [...prev.mealTypes, value],
      }));

      // Sync with quick filters if this meal type has a quick filter
      const quickFilter = QUICK_FILTERS.find(
        (f) => f.type === "mealType" && f.value === value
      );
      if (quickFilter) {
        setActiveQuickFilters((prev) => {
          const next = new Set(prev);
          if (next.has(quickFilter.id)) {
            next.delete(quickFilter.id);
          } else {
            next.add(quickFilter.id);
          }
          return next;
        });
      }
    },
    [setFilters]
  );

  const toggleDietary = useCallback(
    (value: string) => {
      setFilters((prev) => ({
        ...prev,
        dietaryPreferences: prev.dietaryPreferences.includes(value)
          ? prev.dietaryPreferences.filter((d) => d !== value)
          : [...prev.dietaryPreferences, value],
      }));

      // Sync with quick filters if this dietary pref has a quick filter
      const quickFilter = QUICK_FILTERS.find(
        (f) => f.type === "dietary" && f.value === value
      );
      if (quickFilter) {
        setActiveQuickFilters((prev) => {
          const next = new Set(prev);
          if (next.has(quickFilter.id)) {
            next.delete(quickFilter.id);
          } else {
            next.add(quickFilter.id);
          }
          return next;
        });
      }
    },
    [setFilters]
  );

  const toggleFavorites = useCallback(() => {
    setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }));

    // Sync with quick filters
    setActiveQuickFilters((prev) => {
      const next = new Set(prev);
      if (next.has("favorites")) {
        next.delete("favorites");
      } else {
        next.add("favorites");
      }
      return next;
    });
  }, [setFilters]);

  const setMaxCookTime = useCallback(
    (minutes: number | null) => {
      setFilters((prev) => ({ ...prev, maxCookTime: minutes }));

      // Sync with quick filters (under30)
      setActiveQuickFilters((prev) => {
        const next = new Set(prev);
        if (minutes === 30) {
          next.add("under30");
        } else {
          next.delete("under30");
        }
        return next;
      });
    },
    [setFilters]
  );

  const setNewDays = useCallback(
    (days: number | null) => {
      setFilters((prev) => ({ ...prev, newDays: days }));

      // Sync with quick filters
      setActiveQuickFilters((prev) => {
        const next = new Set(prev);
        if (days !== null) {
          next.add("new");
        } else {
          next.delete("new");
        }
        return next;
      });
    },
    [setFilters]
  );

  // -------------------------------------------------------------------------
  // Quick Filter Actions
  // -------------------------------------------------------------------------

  const toggleQuickFilter = useCallback(
    (filterId: string) => {
      const filter = QUICK_FILTERS.find((f) => f.id === filterId);
      if (!filter) return;

      const isActive = activeQuickFilters.has(filterId);

      // Update quick filter set
      setActiveQuickFilters((prev) => {
        const next = new Set(prev);
        if (isActive) {
          next.delete(filterId);
        } else {
          next.add(filterId);
        }
        return next;
      });

      // Update main filter state based on filter type
      setFilters((prev) => {
        switch (filter.type) {
          case "mealType":
            return {
              ...prev,
              mealTypes: isActive
                ? prev.mealTypes.filter((m) => m !== filter.value)
                : [...prev.mealTypes, filter.value as string],
            };
          case "dietary":
            return {
              ...prev,
              dietaryPreferences: isActive
                ? prev.dietaryPreferences.filter((d) => d !== filter.value)
                : [...prev.dietaryPreferences, filter.value as string],
            };
          case "favorite":
            return { ...prev, favoritesOnly: !isActive };
          case "time":
            return { ...prev, maxCookTime: isActive ? null : (filter.value as number) };
          case "new":
            return { ...prev, newDays: isActive ? null : (filter.value as number) };
          default:
            return prev;
        }
      });
    },
    [activeQuickFilters, setFilters]
  );

  // -------------------------------------------------------------------------
  // Bulk Operations
  // -------------------------------------------------------------------------

  const removeActiveFilter = useCallback(
    (filter: ActiveFilter) => {
      setFilters((prev) => removeFilter(prev, filter));

      // Also remove from quick filters if applicable
      const quickFilter = QUICK_FILTERS.find((f) => {
        if (filter.type === "mealType") return f.type === "mealType" && f.value === filter.value;
        if (filter.type === "dietary") return f.type === "dietary" && f.value === filter.value;
        if (filter.type === "favorite") return f.type === "favorite";
        if (filter.type === "time") return f.type === "time";
        if (filter.type === "new") return f.type === "new";
        return false;
      });
      if (quickFilter) {
        setActiveQuickFilters((prev) => {
          const next = new Set(prev);
          next.delete(quickFilter.id);
          return next;
        });
      }
    },
    [setFilters]
  );

  const clearAll = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setActiveQuickFilters(new Set());
  }, [setFilters]);

  // -------------------------------------------------------------------------
  // Filter Application
  // -------------------------------------------------------------------------

  const applyTo = useCallback(
    (recipes: RecipeCardData[]) => applyFilters(recipes, filters),
    [filters]
  );

  return {
    filters,
    activeQuickFilters,
    hasActiveFilters: hasActive,
    activeFiltersList,
    setSearchTerm,
    toggleCategory,
    toggleMealType,
    toggleDietary,
    toggleFavorites,
    setMaxCookTime,
    setNewDays,
    toggleQuickFilter,
    removeActiveFilter,
    clearAll,
    setFilters,
    applyTo,
  };
}
