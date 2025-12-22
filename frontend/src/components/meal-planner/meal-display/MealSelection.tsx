"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { plannerApi } from "@/lib/api";
import { MainDishCard } from "./MainDishCard";
import { SideDishSlots } from "./SideDishSlots";
import { cn } from "@/lib/utils";
import type {
  MealSelectionResponseDTO,
  RecipeCardDTO,
  RecipeCardData,
} from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface MealSelectionProps {
  /** The meal ID to fetch and display */
  mealId: number;
  /** Called when an empty side dish slot is clicked (disabled if not provided) */
  onEmptySideSlotClick?: (index: number) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Maps RecipeCardDTO (backend format) to RecipeCardData (frontend format)
 * for use with SideDishSlots component.
 */
function mapToCardData(recipe: RecipeCardDTO): RecipeCardData {
  return {
    id: recipe.id,
    name: recipe.recipe_name,
    servings: recipe.servings ?? 1,
    totalTime: recipe.total_time ?? 0,
    imageUrl: recipe.reference_image_path ?? undefined,
    isFavorite: recipe.is_favorite,
  };
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function MealSelectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Main dish skeleton */}
      <div className="animate-pulse bg-muted rounded-lg aspect-[2.4/1]" />
      {/* Side dishes skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MEAL SELECTION COMPONENT
// ============================================================================

export function MealSelection({
  mealId,
  onEmptySideSlotClick,
  className,
}: MealSelectionProps) {
  const router = useRouter();
  const [meal, setMeal] = useState<MealSelectionResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigate to recipe detail page
  const handleRecipeClick = (recipeId: number) => {
    router.push(`/recipes/${recipeId}`);
  };

  useEffect(() => {
    async function fetchMeal() {
      try {
        setLoading(true);
        setError(null);
        const data = await plannerApi.getMeal(mealId);
        setMeal(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load meal");
      } finally {
        setLoading(false);
      }
    }

    fetchMeal();
  }, [mealId]);

  // Loading state
  if (loading) {
    return <MealSelectionSkeleton className={className} />;
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          "p-6 text-center rounded-lg border border-destructive/50 bg-destructive/10",
          className
        )}
      >
        <p className="text-destructive font-medium">{error}</p>
      </div>
    );
  }

  // No meal found
  if (!meal) {
    return (
      <div
        className={cn(
          "p-6 text-center rounded-lg border border-muted bg-muted/50",
          className
        )}
      >
        <p className="text-muted-foreground">Meal not found</p>
      </div>
    );
  }

  // Map side recipes to the format SideDishSlots expects
  const sideRecipes = meal.side_recipes.map(mapToCardData);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Dish */}
      {meal.main_recipe ? (
        <MainDishCard
          name={meal.main_recipe.recipe_name}
          imageUrl={meal.main_recipe.reference_image_path}
          servings={meal.main_recipe.servings}
          totalTime={meal.main_recipe.total_time}
          category={meal.main_recipe.recipe_category}
          mealType={meal.main_recipe.meal_type}
          dietaryPreference={meal.main_recipe.diet_pref}
          onClick={() => handleRecipeClick(meal.main_recipe!.id)}
        />
      ) : (
        <div className="p-6 text-center rounded-lg border border-dashed border-muted">
          <p className="text-muted-foreground">No main dish selected</p>
        </div>
      )}

      {/* Side Dishes */}
      <SideDishSlots
        recipes={sideRecipes}
        onFilledSlotClick={(recipe) => handleRecipeClick(Number(recipe.id))}
        onEmptySlotClick={onEmptySideSlotClick}
      />
    </div>
  );
}