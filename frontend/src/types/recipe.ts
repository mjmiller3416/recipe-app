// src/types/recipe.ts

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
  groupIds?: number[]; // IDs of groups this recipe belongs to
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
  // Cooking stats (populated when available)
  times_cooked?: number | null;
  last_cooked?: string | null; // ISO datetime string
  created_at?: string | null; // ISO datetime string - when recipe was added
}

// ============================================================================
// Recipe Create/Update DTOs
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

// ============================================================================
// Recipe Filter Types
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
// Recipe Group Types
// ============================================================================

export interface RecipeGroupResponseDTO {
  id: number;
  name: string;
  created_at: string | null;
  recipe_count: number;
}

export interface RecipeGroupCreateDTO {
  name: string;
}

export interface RecipeGroupUpdateDTO {
  name: string;
}

export interface RecipeGroupAssignmentDTO {
  group_ids: number[];
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
// Cooking Streak Types
// ============================================================================

export interface CookingStreakDTO {
  current_streak: number;
  longest_streak: number;
  week_activity: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  last_cooked_date: string | null;
  today_index: number; // 0=Monday, 6=Sunday - from server to ensure timezone consistency
}
