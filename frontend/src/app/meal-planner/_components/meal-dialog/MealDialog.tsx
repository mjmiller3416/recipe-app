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
import { Skeleton } from "@/components/ui/skeleton";
import { EditorView } from "./views/EditorView";
import { SavedView } from "./views/SavedView";
import { recipeApi, plannerApi } from "@/lib/api";
import { mapRecipesForCards } from "@/lib/recipeCardMapper";
import { QUICK_FILTERS } from "@/lib/constants";
import type {
  RecipeCardData,
  RecipeCardDTO,
  PlannerEntryResponseDTO,
  MealSelectionResponseDTO,
} from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface MealDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog mode - create new meal or edit existing */
  mode: "create" | "edit";
  /** Meal ID to edit (required when mode="edit") */
  mealId?: number | null;
  /** Called when a new meal is created and added to planner (create mode) */
  onEntryCreated?: (entry: PlannerEntryResponseDTO) => void;
  /** Called when an existing meal is updated (edit mode) */
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

function EditorSkeleton() {
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
// MEAL DIALOG COMPONENT
// ============================================================================

/**
 * MealDialog - Unified dialog for creating and editing meals
 *
 * Features:
 * - Create mode: Tabbed interface (Create Meal / Saved Meals), starts empty
 * - Edit mode: Simple header, pre-populates from existing meal
 * - Slot-based recipe selection (1 main + 3 sides)
 * - Auto-advance to next empty slot after selection
 * - Search and filter recipes
 */
export function MealDialog({
  open,
  onOpenChange,
  mode,
  mealId,
  onEntryCreated,
  onMealUpdated,
}: MealDialogProps) {
  // Tab state (only used in create mode)
  const [activeTab, setActiveTab] = useState<"create" | "saved">("create");

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
  const [hasManualName, setHasManualName] = useState(false); // Only used in create mode

  // Recipe data state
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isFetchingMeal, setIsFetchingMeal] = useState(false); // Only used in edit mode

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  // Handle dialog open/close
  useEffect(() => {
    if (open) {
      // Fetch recipes for both modes
      fetchRecipes();

      if (mode === "edit" && mealId) {
        // Edit mode: fetch existing meal data
        fetchMealData(mealId);
      }
    } else {
      // Reset state when dialog closes
      resetState();
    }
  }, [open, mode, mealId]);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------

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
      let firstEmptySlot = 0;
      for (let i = 0; i < 3; i++) {
        if (!sides[i]) {
          firstEmptySlot = i + 1;
          break;
        }
      }
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
    setIsFetchingMeal(false);
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
          case "new":
            // Filter to recipes created within the last N days (value = days)
            if (typeof filter.value === "number" && recipe.createdAt) {
              const createdDate = new Date(recipe.createdAt);
              const cutoffDate = new Date();
              cutoffDate.setDate(cutoffDate.getDate() - filter.value);
              if (createdDate < cutoffDate) return false;
            } else if (!recipe.createdAt) {
              return false; // No createdAt means we can't determine if it's "new"
            }
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
      // In create mode: clear auto-filled name when main recipe is cleared
      if (mode === "create" && !hasManualName) {
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
        // In create mode: auto-fill name from main recipe (if not manually edited)
        if (mode === "create" && !hasManualName) {
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
    [activeSlotIndex, hasManualName, sideRecipes, mainRecipe, mode]
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
    if (mode === "create") {
      setHasManualName(true);
    }
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

  // --------------------------------------------------------------------------
  // Submit Handlers
  // --------------------------------------------------------------------------

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMeal = async () => {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = mode === "create" ? handleCreateMeal : handleUpdateMeal;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  const canSubmit = mainRecipe !== null;
  const isLoading = mode === "edit" && isFetchingMeal;

  // Shared editor content
  const editorContent = isLoading ? (
    <EditorSkeleton />
  ) : (
    <EditorView
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
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0"
        showCloseButton={false}
      >
        {/* Visually hidden title for screen reader accessibility */}
        <DialogTitle className="sr-only">
          {mode === "create" ? "Create or Select a Meal" : "Edit Meal"}
        </DialogTitle>

        {mode === "create" ? (
          // Create mode: Tabbed interface
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "create" | "saved")}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Tab Headers */}
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
              className="flex-1 overflow-y-auto px-6 py-4 mt-0"
            >
              {editorContent}
            </TabsContent>

            <TabsContent
              value="saved"
              className="flex-1 overflow-y-auto px-6 py-4 mt-0"
            >
              <SavedView
                onEntryCreated={(entry) => {
                  onEntryCreated?.(entry);
                  onOpenChange(false);
                }}
              />
            </TabsContent>
          </Tabs>
        ) : (
          // Edit mode: Simple header with content
          <>
            <div className="px-6 pt-6 pb-0">
              <h2 className="text-base font-medium text-primary border-b-2 border-primary inline-block pb-2">
                Edit Meal
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {editorContent}
            </div>
          </>
        )}

        {/* Footer - shown in create mode (on Create tab) or edit mode */}
        {(mode === "edit" || activeTab === "create") && (
          <DialogFooter className="px-6 py-4 border-t border-border flex-shrink-0">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting || isLoading}
            >
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                ? "Create Meal"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
