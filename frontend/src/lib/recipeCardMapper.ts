// lib/recipeCardMapper.ts
import type { 
  RecipeResponseDTO, 
  RecipeIngredientResponseDTO,
  RecipeCardData,
  RecipeIngredient 
} from "@/types";  // ← Should import from @/types, NOT @/components!

export function mapIngredientForCard(dto: RecipeIngredientResponseDTO): RecipeIngredient {
  return {
    id: dto.id,
    name: dto.ingredient_name,
    quantity: dto.quantity ?? 0,
    unit: dto.unit,
    category: dto.ingredient_category,
  };
}

export function mapRecipeForCard(dto: RecipeResponseDTO): RecipeCardData {
  return {
    id: dto.id,
    name: dto.recipe_name,
    servings: dto.servings ?? 0,
    totalTime: dto.total_time ?? 0,
    imageUrl: dto.reference_image_path ?? undefined,
    category: dto.recipe_category,
    mealType: dto.meal_type,
    dietaryPreference: dto.diet_pref ?? undefined,
    isFavorite: dto.is_favorite,
    ingredients: dto.ingredients?.map(mapIngredientForCard) ?? [],
  };
}

export function mapRecipesForCards(dtos: RecipeResponseDTO[]): RecipeCardData[] {
  return dtos.map(mapRecipeForCard);
}