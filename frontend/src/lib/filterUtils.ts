/**
 * Shared filter utilities for recipe filtering across the app.
 * Provides a single source of truth for filter application logic.
 */

import { QUICK_FILTERS, type QuickFilter } from "./constants";
import type { RecipeCardData } from "@/types";

// ============================================================================
// Types
// ============================================================================

/**
 * Normalized filter state - the canonical format used across all filter UIs.
 * Components can use their own state shapes internally but convert to this
 * format when applying filters.
 */
export interface RecipeFilters {
  searchTerm: string;
  categories: string[];
  mealTypes: string[];
  dietaryPreferences: string[];
  favoritesOnly: boolean;
  maxCookTime: number | null;  // "Under 30m" filter uses this (value: 30)
  newDays: number | null;      // "New" filter uses this (value: 2 = last 2 days)
}

/**
 * Active filter for display in filter chips/badges
 */
export interface ActiveFilter {
  type: "category" | "mealType" | "dietary" | "favorite" | "time" | "new";
  value: string;
  label: string;
}

/**
 * Filter option for dropdowns and checkboxes
 */
export interface FilterOption {
  value: string;
  label: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default/empty filter state
 */
export const DEFAULT_FILTERS: RecipeFilters = {
  searchTerm: "",
  categories: [],
  mealTypes: [],
  dietaryPreferences: [],
  favoritesOnly: false,
  maxCookTime: null,
  newDays: null,
};

/**
 * Color classes for active filter chips by type
 */
export const FILTER_CHIP_COLORS: Record<ActiveFilter["type"], string> = {
  category: "bg-primary/20 text-primary border-primary/30",
  mealType: "bg-accent/20 text-accent border-accent/30",
  dietary: "bg-success/20 text-success border-success/30",
  favorite: "bg-destructive/20 text-destructive border-destructive/30",
  time: "bg-secondary/20 text-secondary border-secondary/30",
  new: "bg-info/20 text-info border-info/30",
};

// ============================================================================
// Core Filtering Function
// ============================================================================

/**
 * Apply filters to a list of recipes.
 * This is the single source of truth for filter application logic.
 *
 * Filter behavior:
 * - AND between different filter types (category AND mealType AND dietary)
 * - OR within the same filter type (chicken OR beef within categories)
 * - Search matches name, category, mealType, or dietaryPreference
 */
export function applyFilters(
  recipes: RecipeCardData[],
  filters: RecipeFilters
): RecipeCardData[] {
  let result = recipes;

  // Search filter - matches multiple fields
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    result = result.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(term) ||
        recipe.category?.toLowerCase().includes(term) ||
        recipe.mealType?.toLowerCase().includes(term) ||
        recipe.dietaryPreference?.toLowerCase().includes(term)
    );
  }

  // Category filter (OR logic within)
  if (filters.categories.length > 0) {
    result = result.filter(
      (recipe) => recipe.category && filters.categories.includes(recipe.category)
    );
  }

  // Meal type filter (OR logic within)
  if (filters.mealTypes.length > 0) {
    result = result.filter(
      (recipe) => recipe.mealType && filters.mealTypes.includes(recipe.mealType)
    );
  }

  // Dietary preference filter (OR logic within)
  if (filters.dietaryPreferences.length > 0) {
    result = result.filter(
      (recipe) =>
        recipe.dietaryPreference &&
        filters.dietaryPreferences.includes(recipe.dietaryPreference)
    );
  }

  // Favorites filter
  if (filters.favoritesOnly) {
    result = result.filter((recipe) => recipe.isFavorite);
  }

  // Cook time filter (e.g., Under 30m)
  if (filters.maxCookTime) {
    result = result.filter(
      (recipe) => recipe.totalTime && recipe.totalTime <= filters.maxCookTime!
    );
  }

  // New recipes filter (created within last N days)
  if (filters.newDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.newDays);
    result = result.filter((recipe) => {
      if (!recipe.createdAt) return false;
      const createdDate = new Date(recipe.createdAt);
      return createdDate >= cutoffDate;
    });
  }

  return result;
}

// ============================================================================
// Converter Functions
// ============================================================================

/**
 * Convert quick filter IDs (Set<string>) to RecipeFilters.
 * Used by components that store filters as a Set of filter IDs.
 *
 * @example
 * const filters = quickFiltersToRecipeFilters(new Set(["breakfast", "under30"]));
 * // Returns: { mealTypes: ["breakfast"], maxCookTime: 30, ... }
 */
export function quickFiltersToRecipeFilters(
  quickFilterIds: Set<string> | string[]
): Partial<RecipeFilters> {
  const ids = quickFilterIds instanceof Set ? quickFilterIds : new Set(quickFilterIds);
  const result: Partial<RecipeFilters> = {
    categories: [],
    mealTypes: [],
    dietaryPreferences: [],
    favoritesOnly: false,
    maxCookTime: null,
    newDays: null,
  };

  for (const filterId of ids) {
    const filter = QUICK_FILTERS.find((f) => f.id === filterId);
    if (!filter) continue;

    switch (filter.type) {
      case "mealType":
        result.mealTypes = [...(result.mealTypes || []), filter.value as string];
        break;
      case "dietary":
        result.dietaryPreferences = [...(result.dietaryPreferences || []), filter.value as string];
        break;
      case "favorite":
        result.favoritesOnly = true;
        break;
      case "time":
        result.maxCookTime = filter.value as number;
        break;
      case "new":
        result.newDays = filter.value as number;
        break;
    }
  }

  return result;
}

/**
 * Convert prefixed filter strings to RecipeFilters.
 * Used by components that store filters as prefixed strings (e.g., SavedView).
 *
 * @example
 * const filters = prefixedFiltersToRecipeFilters(["mealType:breakfast", "category:beef"]);
 * // Returns: { mealTypes: ["breakfast"], categories: ["beef"], ... }
 */
export function prefixedFiltersToRecipeFilters(
  prefixedValues: string[]
): Partial<RecipeFilters> {
  const result: Partial<RecipeFilters> = {
    categories: [],
    mealTypes: [],
    dietaryPreferences: [],
    favoritesOnly: false,
    maxCookTime: null,
    newDays: null,
  };

  for (const value of prefixedValues) {
    if (value.startsWith("mealType:")) {
      result.mealTypes = [...(result.mealTypes || []), value.replace("mealType:", "")];
    } else if (value.startsWith("category:")) {
      result.categories = [...(result.categories || []), value.replace("category:", "")];
    } else if (value.startsWith("dietary:")) {
      result.dietaryPreferences = [...(result.dietaryPreferences || []), value.replace("dietary:", "")];
    } else if (value === "favorites") {
      result.favoritesOnly = true;
    }
  }

  return result;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if any filters are active (excluding search term).
 */
export function hasActiveFilters(filters: RecipeFilters): boolean {
  return (
    filters.categories.length > 0 ||
    filters.mealTypes.length > 0 ||
    filters.dietaryPreferences.length > 0 ||
    filters.favoritesOnly ||
    filters.maxCookTime !== null ||
    filters.newDays !== null
  );
}

/**
 * Check if any filters or search are active.
 */
export function hasActiveFiltersOrSearch(filters: RecipeFilters): boolean {
  return hasActiveFilters(filters) || filters.searchTerm.length > 0;
}

/**
 * Build a display-friendly list of active filters for showing as chips/badges.
 *
 * @param filters - Current filter state
 * @param options - Optional label mappings for categories, meal types, dietary
 */
export function getActiveFiltersList(
  filters: RecipeFilters,
  options?: {
    categoryOptions?: FilterOption[];
    mealTypeOptions?: FilterOption[];
    dietaryOptions?: FilterOption[];
  }
): ActiveFilter[] {
  const active: ActiveFilter[] = [];

  // Categories
  for (const cat of filters.categories) {
    const label = options?.categoryOptions?.find((o) => o.value === cat)?.label ?? cat;
    active.push({ type: "category", value: cat, label });
  }

  // Meal types
  for (const mt of filters.mealTypes) {
    const label = options?.mealTypeOptions?.find((o) => o.value === mt)?.label ?? mt;
    active.push({ type: "mealType", value: mt, label });
  }

  // Dietary preferences
  for (const dp of filters.dietaryPreferences) {
    const label = options?.dietaryOptions?.find((o) => o.value === dp)?.label ?? dp;
    active.push({ type: "dietary", value: dp, label });
  }

  // Favorites
  if (filters.favoritesOnly) {
    active.push({ type: "favorite", value: "true", label: "Favorites" });
  }

  // Cook time
  if (filters.maxCookTime) {
    active.push({
      type: "time",
      value: String(filters.maxCookTime),
      label: `Under ${filters.maxCookTime}m`,
    });
  }

  // New recipes
  if (filters.newDays) {
    active.push({
      type: "new",
      value: String(filters.newDays),
      label: "New",
    });
  }

  return active;
}

/**
 * Remove a specific filter from the filter state.
 */
export function removeFilter(
  filters: RecipeFilters,
  filter: ActiveFilter
): RecipeFilters {
  switch (filter.type) {
    case "category":
      return {
        ...filters,
        categories: filters.categories.filter((c) => c !== filter.value),
      };
    case "mealType":
      return {
        ...filters,
        mealTypes: filters.mealTypes.filter((m) => m !== filter.value),
      };
    case "dietary":
      return {
        ...filters,
        dietaryPreferences: filters.dietaryPreferences.filter((d) => d !== filter.value),
      };
    case "favorite":
      return { ...filters, favoritesOnly: false };
    case "time":
      return { ...filters, maxCookTime: null };
    case "new":
      return { ...filters, newDays: null };
    default:
      return filters;
  }
}

/**
 * Merge partial filters into existing filters.
 * Useful for combining converter output with existing state.
 */
export function mergeFilters(
  base: RecipeFilters,
  partial: Partial<RecipeFilters>
): RecipeFilters {
  return {
    ...base,
    ...partial,
    // Merge arrays rather than replace
    categories: partial.categories ?? base.categories,
    mealTypes: partial.mealTypes ?? base.mealTypes,
    dietaryPreferences: partial.dietaryPreferences ?? base.dietaryPreferences,
  };
}
