"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreateView } from "./views/CreateView";
import { SavedView } from "./views/SavedView";
import { recipeApi, plannerApi } from "@/lib/api";
import { mapRecipesForCards } from "@/lib/recipeCardMapper";
import { QUICK_FILTERS } from "@/lib/constants";
import type { RecipeCardData, PlannerEntryResponseDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface CreateMealDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Called when a meal is created and added to the planner */
  onEntryCreated?: (entry: PlannerEntryResponseDTO) => void;
}

// ============================================================================
// CREATE MEAL DIALOG COMPONENT
// ============================================================================

/**
 * CreateMealDialog - Main dialog for creating a meal with main + side dishes
 *
 * Features:
 * - Tabbed interface (Create Meal / Saved Meals)
 * - Slot-based recipe selection (1 main + 3 sides)
 * - Auto-advance to next empty slot after selection
 * - Auto-fill meal name from main recipe
 * - Search and filter recipes
 * - Create meal via API
 */
export function CreateMealDialog({
  open,
  onOpenChange,
  onEntryCreated,
}: CreateMealDialogProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<"create" | "saved">("create");

  // Slot state
  const [mainRecipe, setMainRecipe] = useState<RecipeCardData | null>(null);
  const [sideRecipes, setSideRecipes] = useState<(RecipeCardData | null)[]>([
    null,
    null,
    null,
  ]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0); // 0 = main, 1-3 = sides

  // Form state
  const [mealName, setMealName] = useState("");
  const [hasManualName, setHasManualName] = useState(false);

  // Recipe data state
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  // Fetch recipes when dialog opens
  useEffect(() => {
    if (open) {
      fetchRecipes();
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const data = await recipeApi.list();
      setRecipes(mapRecipesForCards(data));
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------

  const resetState = () => {
    setActiveTab("create");
    setMainRecipe(null);
    setSideRecipes([null, null, null]);
    setActiveSlotIndex(0);
    setMealName("");
    setHasManualName(false);
    setSearchTerm("");
    setActiveFilters(new Set());
    setIsSubmitting(false);
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
            if (typeof filter.value === "number" && recipe.totalTime > filter.value)
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
      // If clearing main and name was auto-filled, clear it too
      if (!hasManualName) {
        setMealName("");
      }
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
        // Auto-fill name from main recipe (if not manually edited)
        if (!hasManualName) {
          setMealName(recipe.name);
        }
      } else {
        const newSides = [...sideRecipes];
        newSides[activeSlotIndex - 1] = recipe;
        setSideRecipes(newSides);
      }

      // Auto-advance to next empty slot
      autoAdvanceSlot(recipe);
    },
    [activeSlotIndex, hasManualName, sideRecipes, mainRecipe]
  );

  const autoAdvanceSlot = (justSelectedRecipe: RecipeCardData) => {
    // Determine what the new state will be after this selection
    const newMain = activeSlotIndex === 0 ? justSelectedRecipe : mainRecipe;
    const newSides = [...sideRecipes];
    if (activeSlotIndex > 0) {
      newSides[activeSlotIndex - 1] = justSelectedRecipe;
    }

    // Find next empty slot (sides first, since main was likely just filled or already filled)
    for (let i = 0; i < 3; i++) {
      if (!newSides[i] && activeSlotIndex !== i + 1) {
        setActiveSlotIndex(i + 1);
        return;
      }
    }

    // If main is empty and we're not already on it, go to main
    if (!newMain && activeSlotIndex !== 0) {
      setActiveSlotIndex(0);
      return;
    }

    // All slots filled, stay on current
  };

  const handleMealNameChange = (name: string) => {
    setMealName(name);
    setHasManualName(true);
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

  const handleCreateMeal = async () => {
    if (!mainRecipe) return;

    setIsSubmitting(true);
    try {
      const sideRecipeIds = sideRecipes
        .filter((r): r is RecipeCardData => r !== null)
        .map((r) => Number(r.id));

      // Step 1: Create the meal
      const meal = await plannerApi.createMeal({
        meal_name: mealName || mainRecipe.name,
        main_recipe_id: Number(mainRecipe.id),
        side_recipe_ids: sideRecipeIds,
      });

      // Step 2: Add meal to planner (creates PlannerEntry)
      const entry = await plannerApi.addToPlanner(meal.id);

      onEntryCreated?.(entry);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create meal:", error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  const canCreate = mainRecipe !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0"
        showCloseButton={false}
      >
        {/* Visually hidden title for screen reader accessibility */}
        <DialogTitle className="sr-only">Create or Select a Meal</DialogTitle>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "create" | "saved")}
          className="flex flex-col h-full"
        >
          {/* Custom underline-style tabs */}
          <div className="px-6 pt-6 pb-0">
            <TabsList className="bg-transparent border-none p-0 gap-6 h-auto w-auto">
              <TabsTrigger
                value="create"
                className="bg-transparent px-0 py-2 text-base font-medium
                           data-[state=active]:bg-transparent data-[state=active]:shadow-none
                           data-[state=active]:text-primary
                           border-b-2 border-transparent data-[state=active]:border-primary
                           rounded-none hover:text-foreground"
              >
                Create Meal
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="bg-transparent px-0 py-2 text-base font-medium
                           data-[state=active]:bg-transparent data-[state=active]:shadow-none
                           data-[state=active]:text-primary
                           border-b-2 border-transparent data-[state=active]:border-primary
                           rounded-none hover:text-foreground"
              >
                Saved Meals
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent
            value="create"
            className="flex-1 overflow-hidden px-6 py-4 mt-0"
          >
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
              isLoadingRecipes={isLoading}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              activeFilters={activeFilters}
              onFilterToggle={handleFilterToggle}
            />
          </TabsContent>

          <TabsContent value="saved" className="flex-1 overflow-hidden px-6 py-4 mt-0">
            <SavedView />
          </TabsContent>
        </Tabs>

        {/* Footer - only show on Create tab */}
        {activeTab === "create" && (
          <DialogFooter className="px-6 py-4 border-t border-border">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateMeal}
              disabled={!canCreate || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Meal"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
