// src/types/ai.ts

// ============================================================================
// Image Generation Types
// ============================================================================

export type ImageGenerationType = "both" | "reference" | "banner";

export interface ImageGenerationRequestDTO {
  recipe_name: string;
  image_type?: ImageGenerationType;
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
// Meal Genie Types
// ============================================================================

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantRequestDTO {
  message: string;
  conversation_history?: AssistantMessage[];
}

export interface AssistantResponseDTO {
  success: boolean;
  response?: string;
  error?: string;
  // Optional recipe data (if AI generated one)
  recipe?: GeneratedRecipeDTO;
  reference_image_data?: string;
  banner_image_data?: string;
}

// ============================================================================
// Recipe Generation Types
// ============================================================================

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
  conversation_history?: AssistantMessage[];
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
export interface AssistantChatMessage extends AssistantMessage {
  recipe?: GeneratedRecipeDTO;
  imageData?: string;
}

// ============================================================================
// Nutrition Estimation Types
// ============================================================================

export interface NutritionIngredientDTO {
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface NutritionEstimationRequestDTO {
  recipe_name: string;
  ingredients: NutritionIngredientDTO[];
  servings?: number | null;
}

export interface NutritionEstimationResponseDTO {
  success: boolean;
  nutrition_facts?: NutritionFactsDTO;
  error?: string;
}

export interface NutritionFactsDTO {
  calories: number | null;
  protein_g: number | null;
  total_fat_g: number | null;
  saturated_fat_g: number | null;
  trans_fat_g: number | null;
  cholesterol_mg: number | null;
  sodium_mg: number | null;
  total_carbs_g: number | null;
  dietary_fiber_g: number | null;
  total_sugars_g: number | null;
  is_ai_estimated: boolean;
}

export interface NutritionFactsResponseDTO extends NutritionFactsDTO {
  id: number;
  recipe_id: number;
}
