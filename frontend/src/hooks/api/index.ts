// src/hooks/api/index.ts
// Barrel export for all centralized API hooks
//
// Usage:
//   import { usePlannerEntries, useRecipes, useDashboardStats } from "@/hooks/api";

// Query Keys (for advanced cache manipulation)
export * from "./queryKeys";

// Events (for cross-component communication)
export * from "./events";

// Planner Hooks
export {
  // Queries
  usePlannerEntries,
  useMeal,
  useMeals,
  useSavedMeals,
  useCookingStreak,
  // Mutations
  useCreateMeal,
  useUpdateMeal,
  useAddToPlanner,
  useRemoveEntry,
  useMarkComplete,
  useMarkIncomplete,
  useToggleSaveMeal,
  useCycleShoppingMode,
  useReorderEntries,
  useClearCompleted,
  useAddSideToMeal,
  useDeleteMeal,
  // Utilities
  useRefreshPlannerEntries,
  useRefreshCookingStreak,
} from "./usePlanner";

// Recipe Hooks
export {
  // Queries
  useRecipes,
  useRecipeCards,
  useRecipe,
  useRecipeCategories,
  useRecipeMealTypes,
  // Mutations
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useToggleFavorite,
  // Utilities
  useRefreshRecipes,
  usePrefetchRecipe,
} from "./useRecipes";

// Dashboard Hooks
export {
  useDashboardStats,
  useRefreshDashboardStats,
} from "./useDashboard";

// AI Hooks
export {
  // Queries
  useCookingTip,
  // Mutations
  useMealSuggestions,
  useGenerateImage,
  useGenerateBanner,
  useMealGenieChat,
  // Utilities
  useRefreshCookingTip,
} from "./useAI";

// Shopping Hooks
export {
  // Query Keys
  shoppingQueryKeys,
  // Queries
  useShoppingList,
  useIngredientBreakdown,
  // Mutations
  useToggleItem,
  useToggleFlagged,
  useAddManualItem,
  useDeleteItem,
  useClearManualItems,
  useClearCompletedItems,
  useGenerateShoppingList,
  // Utilities
  useRefreshShoppingList,
} from "./useShopping";
