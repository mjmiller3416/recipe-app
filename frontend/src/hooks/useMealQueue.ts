"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { MealQueueEntry, SavedMeal, UseMealQueueReturn } from "@/components/meal-planner/types";
import type { RecipeCardDTO, MealSelectionResponseDTO } from "@/types";
import { recipeApi, plannerApi } from "@/lib/api";
import type { MealSelectionCreateDTO } from "@/lib/api";

// Selectable recipe for the create meal modal
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
 * Map RecipeCardDTO to SelectableRecipe for the modal
 */
function mapRecipeCardToSelectable(card: RecipeCardDTO): SelectableRecipe {
  return {
    id: card.id,
    name: card.recipe_name,
    imageUrl: card.reference_image_path ?? undefined,
    servings: card.servings ?? undefined,
    // RecipeCardDTO doesn't have these fields, but they're optional
  };
}

/**
 * Map MealSelectionResponseDTO to SavedMeal for the dropdown
 */
function mapMealToSaved(meal: MealSelectionResponseDTO): SavedMeal {
  return {
    id: meal.id,
    name: meal.meal_name,
    mainRecipeImageUrl: meal.main_recipe?.reference_image_path ?? undefined,
    sideCount: meal.side_recipe_ids.length,
  };
}

/**
 * Map MealSelectionResponseDTO to MealQueueEntry
 * Note: completed and includeInShoppingList are UI-only state
 */
function mapMealToQueueEntry(
  meal: MealSelectionResponseDTO,
  position: number,
  recipes: SelectableRecipe[]
): MealQueueEntry {
  // Find side recipes from the recipes list
  const sideRecipes = meal.side_recipe_ids
    .map((id) => recipes.find((r) => r.id === id))
    .filter((r): r is SelectableRecipe => r !== undefined)
    .map((r) => ({
      id: r.id,
      name: r.name,
      imageUrl: r.imageUrl,
    }));

  return {
    id: meal.id,
    name: meal.meal_name,
    position,
    completed: false, // UI-only state, not persisted
    includeInShoppingList: true, // Default to included
    mainRecipe: {
      id: meal.main_recipe?.id ?? meal.main_recipe_id,
      name: meal.main_recipe?.recipe_name ?? meal.meal_name,
      imageUrl: meal.main_recipe?.reference_image_path ?? undefined,
      servings: meal.main_recipe?.servings ?? 4,
      prepTime: 0, // Not available in RecipeCardDTO
      cookTime: meal.main_recipe?.total_time ?? 0,
      tags: meal.tags ?? [],
    },
    sideRecipes,
  };
}

/**
 * useMealQueue - State management for the weekly meal queue
 *
 * Handles:
 * - Queue state (active/completed meals)
 * - Selection state
 * - Shopping list inclusion toggles
 * - Completion status
 * - Reordering (for drag-and-drop)
 *
 * Uses plannerApi and recipeApi for data persistence
 */
export function useMealQueue(): UseMealQueueReturn & {
  recipes: SelectableRecipe[];
  createMeal: (name: string, mainRecipeId: number, sideRecipeIds: number[], addToQueue: boolean) => void;
  refetch: () => Promise<void>;
} {
  const [meals, setMeals] = useState<MealQueueEntry[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [recipes, setRecipes] = useState<SelectableRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from APIs
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch recipes and meals in parallel
      const [recipeCards, mealsData] = await Promise.all([
        recipeApi.listCards(),
        plannerApi.getMeals(),
      ]);

      // Map recipes
      const selectableRecipes = recipeCards.map(mapRecipeCardToSelectable);
      setRecipes(selectableRecipes);

      // Map saved meals
      const saved = mealsData.map(mapMealToSaved);
      setSavedMeals(saved);

      // Map meals to queue entries
      const queueEntries = mealsData.map((meal, index) =>
        mapMealToQueueEntry(meal, index + 1, selectableRecipes)
      );
      setMeals(queueEntries);

      // Select first meal if none selected
      if (queueEntries.length > 0 && selectedId === null) {
        setSelectedId(queueEntries[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch meal queue data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedId]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Derived state
  const activeMeals = useMemo(
    () => meals.filter((m) => !m.completed).sort((a, b) => a.position - b.position),
    [meals]
  );

  const completedMeals = useMemo(
    () => meals.filter((m) => m.completed).sort((a, b) => a.position - b.position),
    [meals]
  );

  const selectedMeal = useMemo(
    () => meals.find((m) => m.id === selectedId),
    [meals, selectedId]
  );

  // Actions
  const toggleShoppingList = useCallback((id: number) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, includeInShoppingList: !m.includeInShoppingList } : m
      )
    );
  }, []);

  const toggleComplete = useCallback((id: number) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              completed: !m.completed,
              // Auto-exclude from shopping list when completed
              includeInShoppingList: m.completed ? m.includeInShoppingList : false,
            }
          : m
      )
    );
  }, []);

  const removeFromMenu = useCallback(async (id: number) => {
    try {
      // Delete from backend
      await plannerApi.deleteMeal(id);

      // Update local state
      setMeals((prev) => {
        const filtered = prev.filter((m) => m.id !== id);
        // Select next meal if current was removed
        if (selectedId === id && filtered.length > 0) {
          const activeRemaining = filtered.filter((m) => !m.completed);
          setSelectedId(activeRemaining[0]?.id ?? filtered[0]?.id ?? null);
        } else if (filtered.length === 0) {
          setSelectedId(null);
        }
        return filtered;
      });

      // Update saved meals list
      setSavedMeals((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Failed to remove meal:", err);
      setError(err instanceof Error ? err.message : "Failed to remove meal");
    }
  }, [selectedId]);

  const clearCompleted = useCallback(async () => {
    const completedIds = meals.filter((m) => m.completed).map((m) => m.id);

    try {
      // Delete all completed meals from backend
      await Promise.all(completedIds.map((id) => plannerApi.deleteMeal(id)));

      // Update local state
      setMeals((prev) => prev.filter((m) => !m.completed));
      setSavedMeals((prev) => prev.filter((m) => !completedIds.includes(m.id)));
    } catch (err) {
      console.error("Failed to clear completed meals:", err);
      setError(err instanceof Error ? err.message : "Failed to clear completed");
    }
  }, [meals]);

  const addMealToQueue = useCallback((savedMealId: number) => {
    // Find the saved meal and add it to the queue
    const saved = savedMeals.find((m) => m.id === savedMealId);
    if (!saved) return;

    // Check if already in queue
    const alreadyInQueue = meals.some((m) => m.id === savedMealId);
    if (alreadyInQueue) return;

    // Re-fetch to get fresh data including this meal
    fetchData();
  }, [savedMeals, meals, fetchData]);

  const reorderMeals = useCallback((fromIndex: number, toIndex: number) => {
    setMeals((prev) => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      // Update positions
      return result.map((m, i) => ({ ...m, position: i + 1 }));
    });
  }, []);

  // Create a new meal from selected recipes
  const createMeal = useCallback(async (
    name: string,
    mainRecipeId: number,
    sideRecipeIds: number[],
    addToQueue: boolean
  ) => {
    const mainRecipe = recipes.find((r) => r.id === mainRecipeId);
    if (!mainRecipe) return;

    try {
      // Create meal via API
      const createData: MealSelectionCreateDTO = {
        meal_name: name || mainRecipe.name,
        main_recipe_id: mainRecipeId,
        side_recipe_ids: sideRecipeIds,
        is_favorite: false,
        tags: [],
      };

      const newMeal = await plannerApi.createMeal(createData);

      // Add to saved meals
      const newSavedMeal: SavedMeal = {
        id: newMeal.id,
        name: newMeal.meal_name,
        mainRecipeImageUrl: newMeal.main_recipe?.reference_image_path ?? mainRecipe.imageUrl,
        sideCount: sideRecipeIds.length,
      };
      setSavedMeals((prev) => [...prev, newSavedMeal]);

      // If adding to queue, create the queue entry
      if (addToQueue) {
        const sideRecipes = sideRecipeIds
          .map((id) => recipes.find((r) => r.id === id))
          .filter((r): r is SelectableRecipe => r !== undefined)
          .map((r) => ({
            id: r.id,
            name: r.name,
            imageUrl: r.imageUrl,
          }));

        const newQueueEntry: MealQueueEntry = {
          id: newMeal.id,
          name: newMeal.meal_name,
          position: meals.length + 1,
          completed: false,
          includeInShoppingList: true,
          mainRecipe: {
            id: mainRecipe.id,
            name: mainRecipe.name,
            imageUrl: mainRecipe.imageUrl,
            servings: mainRecipe.servings || 4,
            prepTime: mainRecipe.prepTime || 0,
            cookTime: mainRecipe.cookTime || 0,
            tags: mainRecipe.tags || [],
          },
          sideRecipes,
        };

        setMeals((prev) => [...prev, newQueueEntry]);
        setSelectedId(newMeal.id);
      }
    } catch (err) {
      console.error("Failed to create meal:", err);
      setError(err instanceof Error ? err.message : "Failed to create meal");
    }
  }, [recipes, meals.length]);

  return {
    meals,
    selectedId,
    activeMeals,
    completedMeals,
    selectedMeal,
    savedMeals,
    isLoading,
    error,
    recipes,
    createMeal,
    refetch: fetchData,
    actions: {
      setSelectedId,
      toggleShoppingList,
      toggleComplete,
      removeFromMenu,
      clearCompleted,
      addMealToQueue,
      reorderMeals,
    },
  };
}