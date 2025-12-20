/**
 * Meal Planner Types
 * 
 * These extend/complement the existing types in types/index.ts
 * MealSelectionResponseDTO, MealPlanSummaryDTO, etc.
 */

/**
 * Recipe data for selection in CreateMealModal
 * Simplified subset of full recipe for the picker UI
 */
export interface SelectableRecipe {
  id: number;
  name: string;
  imageUrl?: string;
  category?: string;
  mealType?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  tags?: string[];
}

/**
 * Side recipe in a meal (subset of full recipe data)
 */
export interface MealSideRecipe {
  id: number;
  name: string;
  imageUrl?: string;
}

/**
 * Main recipe in a meal (subset of full recipe data)
 */
export interface MealMainRecipe {
  id: number;
  name: string;
  imageUrl?: string;
  servings: number;
  prepTime: number;    // in minutes
  cookTime: number;    // in minutes
  tags: string[];
}

/**
 * A meal entry in the weekly menu queue
 * Extends backend MealSelectionResponseDTO with UI state
 */
export interface MealQueueEntry {
  id: number;
  name: string;
  mainRecipe: MealMainRecipe;
  sideRecipes: MealSideRecipe[];  // max 3
  completed: boolean;
  includeInShoppingList: boolean;
  position: number;  // for ordering in the queue
}

/**
 * A saved meal (for the "Browse Saved Meals" dropdown)
 */
export interface SavedMeal {
  id: number;
  name: string;
  mainRecipeImageUrl?: string;
  sideCount: number;
}

/**
 * Props for the queue card component
 */
export interface MealQueueCardProps {
  meal: MealQueueEntry;
  isSelected: boolean;
  onSelect: () => void;
  onToggleShoppingList: () => void;
  onToggleComplete: () => void;
}

/**
 * Props for the shopping list indicator
 */
export interface ShoppingListIndicatorProps {
  included: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

/**
 * Return type for useMealQueue hook
 */
export interface UseMealQueueReturn {
  meals: MealQueueEntry[];
  selectedId: number | null;
  activeMeals: MealQueueEntry[];
  completedMeals: MealQueueEntry[];
  selectedMeal: MealQueueEntry | undefined;
  savedMeals: SavedMeal[];
  isLoading: boolean;
  error: string | null;
  actions: {
    setSelectedId: (id: number) => void;
    toggleShoppingList: (id: number) => void;
    toggleComplete: (id: number) => void;
    removeFromMenu: (id: number) => void;
    clearCompleted: () => void;
    addMealToQueue: (savedMealId: number) => void;
    reorderMeals: (fromIndex: number, toIndex: number) => void;
  };
}