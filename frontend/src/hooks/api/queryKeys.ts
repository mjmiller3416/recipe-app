// src/hooks/api/queryKeys.ts
// Centralized query key factories for React Query cache management
//
// Query keys follow a hierarchical structure enabling targeted invalidation:
// - Invalidate plannerQueryKeys.all to clear ALL planner-related cache
// - Invalidate plannerQueryKeys.entries() to clear just the entries list
// - Invalidate plannerQueryKeys.meal(5) to clear just meal #5

export const plannerQueryKeys = {
  all: ["planner"] as const,
  entries: () => [...plannerQueryKeys.all, "entries"] as const,
  meal: (id: number) => [...plannerQueryKeys.all, "meal", id] as const,
  meals: () => [...plannerQueryKeys.all, "meals"] as const,
  savedMeals: () => [...plannerQueryKeys.all, "saved-meals"] as const,
  streak: () => [...plannerQueryKeys.all, "streak"] as const,
  summary: () => [...plannerQueryKeys.all, "summary"] as const,
};

export const recipeQueryKeys = {
  all: ["recipes"] as const,
  list: (filters?: Record<string, unknown>) =>
    filters
      ? ([...recipeQueryKeys.all, "list", filters] as const)
      : ([...recipeQueryKeys.all, "list"] as const),
  cards: (filters?: Record<string, unknown>) =>
    filters
      ? ([...recipeQueryKeys.all, "cards", filters] as const)
      : ([...recipeQueryKeys.all, "cards"] as const),
  detail: (id: number) => [...recipeQueryKeys.all, "detail", id] as const,
  categories: () => [...recipeQueryKeys.all, "categories"] as const,
  mealTypes: () => [...recipeQueryKeys.all, "meal-types"] as const,
};

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardQueryKeys.all, "stats"] as const,
};

export const aiQueryKeys = {
  all: ["ai"] as const,
  cookingTip: () => [...aiQueryKeys.all, "cooking-tip"] as const,
};

// Re-export shopping keys for consistency
export { shoppingQueryKeys } from "./useShopping";
