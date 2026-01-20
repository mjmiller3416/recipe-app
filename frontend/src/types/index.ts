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
  createdAt?: string; // ISO date string for "new recipes" filter
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
  banner_image_path: string | null;
  servings: number | null;
  total_time: number | null;
  // Optional metadata for badge display
  recipe_category?: string | null;
  meal_type?: string | null;
  diet_pref?: string | null;
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
  side_recipe_ids: number[];
  is_favorite: boolean;
  is_saved: boolean;
  tags: string[];
}

export interface MealSelectionResponseDTO extends MealSelectionBaseDTO {
  id: number;
  created_at: string | null;
  main_recipe: RecipeCardDTO | null;
  side_recipes: RecipeCardDTO[];
  // Computed stats (calculated on the fly by backend)
  total_cook_time: number | null;
  avg_servings: number | null;
  times_cooked: number | null;
  last_cooked: string | null;
}

/**
 * Planner entry with hydrated meal data.
 * Represents a meal added to the weekly planner.
 */
export interface PlannerEntryResponseDTO {
  id: number;
  meal_id: number;
  position: number;
  is_completed: boolean;
  completed_at: string | null;
  scheduled_date: string | null;
  shopping_mode?: ShoppingMode;
  // Hydrated meal data
  meal_name: string | null;
  meal_is_favorite?: boolean;
  meal_is_saved?: boolean;
  main_recipe_id: number | null;
  side_recipe_ids: number[];
  main_recipe: RecipeCardDTO | null;
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

/** Shopping mode for planner entries - controls ingredient inclusion in shopping list */
export type ShoppingMode = "all" | "produce_only" | "none";

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
  flagged: boolean;
  state_key: string | null;
  recipe_sources: string[];  // List of recipe names this ingredient comes from
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
  side_recipe_ids?: number[];
  is_favorite?: boolean;
  is_saved?: boolean;
  tags?: string[];
}

export interface MealSelectionUpdateDTO {
  meal_name?: string;
  main_recipe_id?: number;
  side_recipe_ids?: number[];
  is_favorite?: boolean;
  is_saved?: boolean;
  tags?: string[];
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
  category?: string | null;
}

export interface ShoppingItemUpdateDTO {
  ingredient_name?: string;
  quantity?: number;
  unit?: string | null;
  category?: string | null;
  have?: boolean;
  flagged?: boolean;
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
    usage_count: number;
  }[];
}

// ============================================================================
// Data Management Types (Import/Export)
// ============================================================================

export type DuplicateAction = "skip" | "update" | "rename";

export interface DuplicateRecipeDTO {
  recipe_name: string;
  recipe_category: string;
  existing_id: number;
  row_number: number;
}

export interface ValidationErrorDTO {
  row_number: number;
  field: string;
  message: string;
}

export interface ImportPreviewDTO {
  total_recipes: number;
  new_recipes: number;
  duplicate_recipes: DuplicateRecipeDTO[];
  validation_errors: ValidationErrorDTO[];
}

export interface ImportResultDTO {
  success: boolean;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  errors: string[];
}

export interface DuplicateResolutionDTO {
  recipe_name: string;
  recipe_category: string;
  action: DuplicateAction;
  new_name?: string;
}

export interface ExportFilterDTO {
  recipe_category?: string | null;
  meal_type?: string | null;
  favorites_only?: boolean;
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

// ============================================================================
// Image Generation Types
// ============================================================================

export interface ImageGenerationRequestDTO {
  recipe_name: string;
}

export interface ImageGenerationResponseDTO {
  success: boolean;
  reference_image_data?: string; // Base64 encoded (1:1 square)
  banner_image_data?: string; // Base64 encoded (21:9 ultrawide)
  error?: string;
}

export interface BannerGenerationResponseDTO {
  success: boolean;
  banner_image_data?: string; // Base64 encoded (21:9 ultrawide)
  error?: string;
}

// ============================================================================
// Cooking Tip Types
// ============================================================================

export interface CookingTipResponseDTO {
  success: boolean;
  tip?: string;
  error?: string;
}

// ============================================================================
// Meal Suggestions Types
// ============================================================================

export interface MealSuggestionsRequestDTO {
  main_recipe_name: string;
  main_recipe_category?: string;
  meal_type?: string;
}

export interface MealSuggestionsResponseDTO {
  success: boolean;
  cooking_tip?: string;
  error?: string;
}

// ============================================================================
// Cooking Streak Types
// ============================================================================

export interface CookingStreakDTO {
  current_streak: number;
  longest_streak: number;
  week_activity: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  last_cooked_date: string | null;
  today_index: number; // 0=Monday, 6=Sunday - from server to ensure timezone consistency
}

// ============================================================================
// Meal Genie Types
// ============================================================================

export interface MealGenieMessage {
  role: "user" | "assistant";
  content: string;
}

export interface MealGenieRequestDTO {
  message: string;
  conversation_history?: MealGenieMessage[];
}

export interface MealGenieResponseDTO {
  success: boolean;
  response?: string;
  error?: string;
}

// Recipe Generation Types

export interface GeneratedIngredientDTO {
  ingredient_name: string;
  ingredient_category: string;
  quantity?: number;
  unit?: string;
}

export interface GeneratedRecipeDTO {
  recipe_name: string;
  recipe_category: string;
  meal_type: string;
  diet_pref?: string;
  total_time?: number;
  servings?: number;
  directions?: string;
  notes?: string;
  ingredients: GeneratedIngredientDTO[];
}

export interface RecipeGenerationRequestDTO {
  message: string;
  conversation_history?: MealGenieMessage[];
  generate_image?: boolean;
}

export interface RecipeGenerationResponseDTO {
  success: boolean;
  recipe?: GeneratedRecipeDTO;
  reference_image_data?: string; // Base64 encoded (1:1 square)
  banner_image_data?: string; // Base64 encoded (21:9 ultrawide)
  ai_message?: string;
  needs_more_info: boolean;
  error?: string;
}

// Extended message type for chat with recipe data
export interface MealGenieChatMessage extends MealGenieMessage {
  recipe?: GeneratedRecipeDTO;
  imageData?: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStatsDTO {
  total_recipes: number;
  favorites: number;
  meals_planned: number;
  shopping_items: number;
}