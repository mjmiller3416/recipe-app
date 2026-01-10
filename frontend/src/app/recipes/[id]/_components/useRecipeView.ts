"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { recipeApi, plannerApi } from "@/lib/api";
import type { RecipeResponseDTO, PlannerEntryResponseDTO } from "@/types";
import { useRecentRecipes } from "@/hooks";
import { parseDirections, groupIngredientsByCategory } from "./recipe-utils";

/**
 * Custom hook for managing recipe detail view state and logic.
 * Handles data fetching, favorites, ingredient/step progress, and CRUD operations.
 */
export function useRecipeView(recipeId: number) {
  const router = useRouter();
  const { addToRecent } = useRecentRecipes();

  // State
  const [recipe, setRecipe] = useState<RecipeResponseDTO | null>(null);
  const [plannerEntries, setPlannerEntries] = useState<PlannerEntryResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Load recipe data
  useEffect(() => {
    async function fetchData() {
      try {
        const [foundRecipe, entries] = await Promise.all([
          recipeApi.get(recipeId),
          plannerApi.getEntries(),
        ]);
        setRecipe(foundRecipe);
        setIsFavorite(foundRecipe.is_favorite);
        setPlannerEntries(entries);

        // Track this recipe as recently viewed
        addToRecent({
          id: foundRecipe.id,
          name: foundRecipe.recipe_name,
          category: foundRecipe.recipe_category || undefined,
        });
      } catch (error) {
        console.error("Failed to fetch recipe:", error);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [recipeId, addToRecent]);

  // Parse directions
  const directions = useMemo(() => {
    return parseDirections(recipe?.directions || null);
  }, [recipe?.directions]);

  // Group ingredients
  const groupedIngredients = useMemo(() => {
    if (!recipe?.ingredients) return new Map<string, RecipeResponseDTO["ingredients"]>();
    return groupIngredientsByCategory(recipe.ingredients);
  }, [recipe?.ingredients]);

  // Handlers
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // In production: await fetch(`/api/recipes/${recipeId}/favorite`, { method: 'POST' })
  };

  const handleIngredientToggle = (ingredientId: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  };

  const handleStepToggle = (stepIndex: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepIndex)) {
        next.delete(stepIndex);
      } else {
        next.add(stepIndex);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    try {
      await recipeApi.delete(recipeId);
      router.push("/recipes");
    } catch (error) {
      console.error("Failed to delete recipe:", error);
    }
  };

  const handleMealAdded = async () => {
    // Refresh planner entries after adding recipe to meal
    const entries = await plannerApi.getEntries();
    setPlannerEntries(entries);
  };

  // Progress calculations
  const ingredientProgress = recipe?.ingredients.length
    ? Math.round((checkedIngredients.size / recipe.ingredients.length) * 100)
    : 0;
  const stepProgress = directions.length
    ? Math.round((completedSteps.size / directions.length) * 100)
    : 0;

  return {
    // Data
    recipe,
    loading,
    isFavorite,
    plannerEntries,
    directions,
    groupedIngredients,

    // Progress state
    checkedIngredients,
    completedSteps,
    ingredientProgress,
    stepProgress,

    // Handlers
    handleFavoriteToggle,
    handleIngredientToggle,
    handleStepToggle,
    handleDelete,
    handleMealAdded,
  };
}
