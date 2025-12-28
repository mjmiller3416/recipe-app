// lib/recipeCardMapper.ts
// Maps backend DTOs to frontend RecipeCardData format

import type { 
  RecipeResponseDTO, 
  RecipeIngredientResponseDTO,
  RecipeCardData,
  RecipeIngredient 
} from "@/types";
import { getRecipeImageUrl } from "./imageUtils";

/**
 * Map a single ingredient from backend DTO to frontend format
 */
export function mapIngredientForCard(dto: RecipeIngredientResponseDTO): RecipeIngredient {
  return {
    id: dto.id,
    name: dto.ingredient_name,
    quantity: dto.quantity ?? 0,
    unit: dto.unit,
    category: dto.ingredient_category,
  };
}

/**
 * Map a single recipe from backend DTO to frontend RecipeCardData format
 * 
 * Image path handling:
 * - Transforms database paths to valid web URLs
 * - Filters out local filesystem paths (from old Python app)
 * - Returns undefined for invalid paths (triggers placeholder in RecipeCard)
 */
export function mapRecipeForCard(dto: RecipeResponseDTO): RecipeCardData {
  return {
    id: dto.id,
    name: dto.recipe_name,
    servings: dto.servings ?? 0,
    totalTime: dto.total_time ?? 0,
    // Use imageUtils to handle path transformation and validation
    imageUrl: getRecipeImageUrl(dto.reference_image_path),
    category: dto.recipe_category,
    mealType: dto.meal_type,
    dietaryPreference: dto.diet_pref ?? undefined,
    isFavorite: dto.is_favorite ?? false,
    ingredients: dto.ingredients?.map(mapIngredientForCard) ?? [],
    createdAt: dto.created_at ?? undefined,
  };
}

/**
 * Map an array of recipe DTOs to frontend format
 */
export function mapRecipesForCards(dtos: RecipeResponseDTO[]): RecipeCardData[] {
  return dtos.map(mapRecipeForCard);
}
