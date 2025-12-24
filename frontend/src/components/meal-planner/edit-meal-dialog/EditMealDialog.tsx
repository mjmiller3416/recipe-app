"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateView } from "../create-meal-dialog/views/CreateView";
import { recipeApi, plannerApi } from "@/lib/api";
import { mapRecipesForCards } from "@/lib/recipeCardMapper";
import { QUICK_FILTERS } from "@/lib/constants";
import type {
  RecipeCardData,
  RecipeCardDTO,
  MealSelectionResponseDTO,
} from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface EditMealDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** The meal ID to edit (null when closed) */
  mealId: number | null;
  /** Called when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Called when meal is successfully updated */
  onMealUpdated?: (meal: MealSelectionResponseDTO) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Map RecipeCardDTO (from meal response) to RecipeCardData (for UI slots)
 */
function mapRecipeCardDtoToCardData(
  dto: RecipeCardDTO | null
): RecipeCardData | null {
  if (!dto) return null;
  return {
    id: dto.id,
    name: dto.recipe_name,
    servings: dto.servings ?? 0,
    totalTime: dto.total_time ?? 0,
    imageUrl: dto.reference_image_path ?? undefined,
    isFavorite: dto.is_favorite,
  };
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function EditMealSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EDIT MEAL DIALOG COMPONENT
// ============================================================================

/**
 * EditMealDialog - Dialog for editing an existing meal
 *
 * Features:
 * - Fetches existing meal data on open
 * - Pre-populates slots with existing recipes
 * - Slot-based recipe selection (1 main + 3 sides)
 * - Search and filter recipes
 * - Update meal via API
 */
export function EditMealDialog({
  open,
  mealId,
  onOpenChange,
  onMealUpdated,
}: EditMealDialogProps) {
  // Slot state
  const [mainRecipe, setMainRecipe] = useState<RecipeCardData | null>(null);
  const [sideRecipes, setSideRecipes] = useState<(RecipeCardData | null)[]>([
    null,
    null,
    null,
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);

  // Form state
  const [mealName, setMealName] = useState("");

  // Recipe data state
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isFetchingMeal, setIsFetchingMeal] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  // Fetch meal data and recipes when dialog opens
  useEffect(() => {
    if (open && mealId) {
      fetchMealData(mealId);
      fetchRecipes();
    }
  }, [open, mealId]);

  // Reset filter state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setActiveFilters(new Set());
      setActiveSlotIndex(0);
    }
  }, [open]);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------

  const fetchMealData = async (id: number) => {
    setIsFetchingMeal(true);
    try {
      const meal = await plannerApi.getMeal(id);

      // Pre-populate state from meal data
      setMealName(meal.meal_name);
      const mainRecipeData = mapRecipeCardDtoToCardData(meal.main_recipe);
      setMainRecipe(mainRecipeData);

      // Map side recipes (fill with nulls if fewer than 3)
      const sides: (RecipeCardData | null)[] = [null, null, null];
      meal.side_recipes.forEach((recipe, index) => {
        if (index < 3) {
          sides[index] = mapRecipeCardDtoToCardData(recipe);
        }
      });
      setSideRecipes(sides);

      // Auto-select first empty slot
      // Check sides first (index 1, 2, 3), then main (index 0)
      let firstEmptySlot = 0;
      for (let i = 0; i < 3; i++) {
        if (!sides[i]) {
          firstEmptySlot = i + 1; // Side slots are 1, 2, 3
          break;
        }
      }
      // If all sides filled but no main, select main
      if (firstEmptySlot === 0 && !mainRecipeData) {
        firstEmptySlot = 0;
      }
      setActiveSlotIndex(firstEmptySlot);
    } catch (error) {
      console.error("Failed to fetch meal:", error);
    } finally {
      setIsFetchingMeal(false);
    }
  };

  const fetchRecipes = async () => {
    setIsLoadingRecipes(true);
    try {
      const data = await recipeApi.list();
      setRecipes(mapRecipesForCards(data));
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // --------------------------------------------------------------------------
  // Filtering Logic
  // --------------------------------------------------------------------------

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search filter - match by name
      if (
        searchTerm &&
        !recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Quick filters
      for (const filterId of activeFilters) {
        const filter = QUICK_FILTERS.find((f) => f.id === filterId);
        if (!filter) continue;

        switch (filter.type) {
          case "mealType":
            if (recipe.mealType?.toLowerCase() !== filter.value) return false;
            break;
          case "dietary":
            if (recipe.dietaryPreference?.toLowerCase() !== filter.value)
              return false;
            break;
          case "time":
            if (
              typeof filter.value === "number" &&
              recipe.totalTime > filter.value
            )
              return false;
            break;
          case "favorite":
            if (!recipe.isFavorite) return false;
            break;
        }
      }

      return true;
    });
  }, [recipes, searchTerm, activeFilters]);

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  const handleSlotClick = (index: number) => {
    setActiveSlotIndex(index);
  };

  const handleSlotClear = (index: number) => {
    if (index === 0) {
      setMainRecipe(null);
    } else {
      const newSides = [...sideRecipes];
      newSides[index - 1] = null;
      setSideRecipes(newSides);
    }
  };

  const handleRecipeSelect = useCallback(
    (recipe: RecipeCardData) => {
      if (activeSlotIndex === 0) {
        setMainRecipe(recipe);
      } else {
        const newSides = [...sideRecipes];
        newSides[activeSlotIndex - 1] = recipe;
        setSideRecipes(newSides);
      }

      // Auto-advance to next empty slot
      autoAdvanceSlot(recipe);
    },
    [activeSlotIndex, sideRecipes, mainRecipe]
  );

  const autoAdvanceSlot = (justSelectedRecipe: RecipeCardData) => {
    const newMain = activeSlotIndex === 0 ? justSelectedRecipe : mainRecipe;
    const newSides = [...sideRecipes];
    if (activeSlotIndex > 0) {
      newSides[activeSlotIndex - 1] = justSelectedRecipe;
    }

    // Find next empty slot
    for (let i = 0; i < 3; i++) {
      if (!newSides[i] && activeSlotIndex !== i + 1) {
        setActiveSlotIndex(i + 1);
        return;
      }
    }

    if (!newMain && activeSlotIndex !== 0) {
      setActiveSlotIndex(0);
      return;
    }
  };

  const handleMealNameChange = (name: string) => {
    setMealName(name);
  };

  const handleFilterToggle = (id: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSaveChanges = async () => {
    if (!mealId || !mainRecipe) return;

    setIsSubmitting(true);
    try {
      const sideRecipeIds = sideRecipes
        .filter((r): r is RecipeCardData => r !== null)
        .map((r) => Number(r.id));

      const updatedMeal = await plannerApi.updateMeal(mealId, {
        meal_name: mealName,
        main_recipe_id: Number(mainRecipe.id),
        side_recipe_ids: sideRecipeIds,
      });

      onMealUpdated?.(updatedMeal);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update meal:", error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  const canSave = mainRecipe !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0"
        showCloseButton={false}
      >
        {/* Visually hidden title for screen reader accessibility */}
        <DialogTitle className="sr-only">Edit Meal</DialogTitle>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-foreground">Edit Meal</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          {isFetchingMeal ? (
            <EditMealSkeleton />
          ) : (
            <CreateView
              mealName={mealName}
              onMealNameChange={handleMealNameChange}
              slots={{
                main: mainRecipe,
                sides: sideRecipes,
              }}
              activeSlotIndex={activeSlotIndex}
              onSlotClick={handleSlotClick}
              onSlotClear={handleSlotClear}
              onRecipeSelect={handleRecipeSelect}
              recipes={filteredRecipes}
              isLoadingRecipes={isLoadingRecipes}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              activeFilters={activeFilters}
              onFilterToggle={handleFilterToggle}
            />
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={!canSave || isSubmitting || isFetchingMeal}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
