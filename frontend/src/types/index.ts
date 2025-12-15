// src/types/index.ts

// ============================================================================
// Recipe Card Component Types (Frontend/UI)
// ============================================================================

/**
 * Ingredient data structure for RecipeCard component
 * (Different from backend RecipeIngredientResponseDTO)
 */
export interface RecipeIngredient {
  id?: string | number;
  name: string;
  quantity: number;
  unit: string | null;
  category?: string;
}

/**
 * Recipe data structure for RecipeCard component
 * (Converted from RecipeResponseDTO via mapper)
 */
export interface RecipeCardData {
  id: string | number;
  name: string;
  servings: number;
  totalTime: number; // in minutes
  imageUrl?: string;
  category?: string;
  mealType?: string;
  dietaryPreference?: string;
  isFavorite?: boolean;
  ingredients?: RecipeIngredient[]; // For large card display
}

// ============================================================================
// Recipe Types (Backend DTOs)
// ============================================================================

export interface RecipeIngredientResponseDTO {
  id: number;
  ingredient_name: string;
  ingredient_category: string;
  quantity: number | null;
  unit: string | null;
}

export interface RecipeBaseDTO {
  recipe_name: string;
  recipe_category: string;
  meal_type: string;
  diet_pref: string | null;
  total_time: number | null;
  servings: number | null;
  directions: string | null;
  notes: string | null;
  reference_image_path: string | null;
  banner_image_path: string | null;
}

export interface RecipeResponseDTO extends RecipeBaseDTO {
  id: number;
  is_favorite: boolean;
  created_at: string | null;
  ingredients: RecipeIngredientResponseDTO[];
}

export interface RecipeCardDTO {
  id: number;
  recipe_name: string;
  is_favorite: boolean;
  reference_image_path: string | null;
  servings: number | null;
  total_time: number | null;
}

// ============================================================================
// Ingredient Types
// ============================================================================

export interface IngredientBaseDTO {
  ingredient_name: string;
  ingredient_category: string;
}

export interface IngredientResponseDTO extends IngredientBaseDTO {
  id: number;
}

export interface IngredientDetailDTO extends IngredientBaseDTO {
  quantity: number | null;
  unit: string | null;
}

// ============================================================================
// Meal Planning Types
// ============================================================================

export interface MealSelectionBaseDTO {
  meal_name: string;
  main_recipe_id: number;
  side_recipe_1_id: number | null;
  side_recipe_2_id: number | null;
  side_recipe_3_id: number | null;
}

export interface MealSelectionResponseDTO extends MealSelectionBaseDTO {
  id: number;
  main_recipe: RecipeCardDTO | null;
  side_recipe_1: RecipeCardDTO | null;
  side_recipe_2: RecipeCardDTO | null;
  side_recipe_3: RecipeCardDTO | null;
}

export interface MealPlanSummaryDTO {
  total_meals: number;
  total_recipes: number;
  meal_names: string[];
  has_saved_plan: boolean;
  error: string | null;
}

// ============================================================================
// Shopping List Types
// ============================================================================

export type ShoppingSource = "recipe" | "manual";

export interface ShoppingItemBaseDTO {
  ingredient_name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
}

export interface ShoppingItemResponseDTO extends ShoppingItemBaseDTO {
  id: number;
  source: ShoppingSource;
  have: boolean;
  state_key: string | null;
}

export interface ShoppingListResponseDTO {
  items: ShoppingItemResponseDTO[];
  total_items: number;
  checked_items: number;
  recipe_items: number;
  manual_items: number;
  categories: string[];
}

export interface ShoppingListGenerationResultDTO {
  success: boolean;
  items_created: number;
  items_updated: number;
  total_items: number;
  message: string;
  errors: string[];
  items: ShoppingItemResponseDTO[];
}

// ============================================================================
// Filter Types
// ============================================================================

export interface RecipeFilterDTO {
  recipe_category: string | null;
  meal_type: string | null;
  diet_pref: string | null;
  cook_time: number | null;
  servings: number | null;
  sort_by: "recipe_name" | "created_at" | "total_time" | "servings" | null;
  sort_order: "asc" | "desc";
  favorites_only: boolean;
  search_term: string | null;
  limit: number | null;
  offset: number | null;
}

// ============================================================================
// Create/Update DTOs (for API requests)
// ============================================================================

export interface RecipeIngredientDTO {
  existing_ingredient_id?: number | null;
  ingredient_name: string;
  ingredient_category: string;
  quantity?: number | null;
  unit?: string | null;
}

export interface RecipeCreateDTO {
  recipe_name: string;
  recipe_category: string;
  meal_type?: string;
  diet_pref?: string | null;
  total_time?: number | null;
  servings?: number | null;
  directions?: string | null;
  notes?: string | null;
  reference_image_path?: string | null;
  banner_image_path?: string | null;
  ingredients?: RecipeIngredientDTO[];
}

export interface RecipeUpdateDTO {
  recipe_name?: string;
  recipe_category?: string;
  meal_type?: string;
  diet_pref?: string | null;
  total_time?: number | null;
  servings?: number | null;
  directions?: string | null;
  notes?: string | null;
  reference_image_path?: string | null;
  banner_image_path?: string | null;
  ingredients?: RecipeIngredientDTO[];
  is_favorite?: boolean;
}

export interface MealSelectionCreateDTO {
  meal_name: string;
  main_recipe_id: number;
  side_recipe_1_id?: number | null;
  side_recipe_2_id?: number | null;
  side_recipe_3_id?: number | null;
}

export interface MealSelectionUpdateDTO {
  meal_name?: string;
  main_recipe_id?: number;
  side_recipe_1_id?: number | null;
  side_recipe_2_id?: number | null;
  side_recipe_3_id?: number | null;
}

export interface MealPlanSaveResultDTO {
  success: boolean;
  saved_count: number;
  invalid_ids: number[];
  message: string;
}

export interface ManualItemCreateDTO {
  ingredient_name: string;
  quantity: number;
  unit?: string | null;
}

export interface ShoppingItemUpdateDTO {
  ingredient_name?: string;
  quantity?: number;
  unit?: string | null;
  category?: string | null;
  have?: boolean;
}

export interface ShoppingListFilterDTO {
  source?: ShoppingSource;
  category?: string;
  have?: boolean;
  search_term?: string;
  limit?: number;
  offset?: number;
}

export interface ShoppingListGenerationDTO {
  recipe_ids: number[];
  include_manual_items?: boolean;
  clear_existing?: boolean;
}

export interface BulkOperationResultDTO {
  success: boolean;
  updated_count: number;
  message: string;
  errors?: string[];
}

export interface IngredientCreateDTO {
  ingredient_name: string;
  ingredient_category: string;
}

export interface IngredientSearchDTO {
  search_term: string;
  category?: string | null;
  limit?: number | null;
  offset?: number | null;
}

export interface IngredientBreakdownDTO {
  ingredient_name: string;
  total_quantity: number;
  unit: string;
  recipe_contributions: {
    recipe_name: string;
    quantity: number;
    unit: string | null;
  }[];
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ValidationResult {
  is_valid: boolean;
  error_message: string;
}

export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, unknown>;
}