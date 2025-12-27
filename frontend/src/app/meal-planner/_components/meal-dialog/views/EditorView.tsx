"use client";

import { Input } from "@/components/ui/input";
import { MealSlot } from "../components/MealSlot";
import { FilterBar } from "../components/FilterBar";
import { RecipeGrid } from "../components/RecipeGrid";
import { cn } from "@/lib/utils";
import type { RecipeCardData } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface EditorViewProps {
  /** Current meal name */
  mealName: string;
  /** Called when meal name changes */
  onMealNameChange: (name: string) => void;
  /** Slot state - main dish and 3 side dishes */
  slots: {
    main: RecipeCardData | null;
    sides: (RecipeCardData | null)[];
  };
  /** Currently active slot index (0 = main, 1-3 = sides) */
  activeSlotIndex: number;
  /** Called when a slot is clicked */
  onSlotClick: (index: number) => void;
  /** Called when a slot's clear button is clicked */
  onSlotClear: (index: number) => void;
  /** Called when a recipe is selected from the grid */
  onRecipeSelect: (recipe: RecipeCardData) => void;
  /** Available recipes to display in the grid */
  recipes: RecipeCardData[];
  /** Whether recipes are loading */
  isLoadingRecipes: boolean;
  /** Current search term */
  searchTerm: string;
  /** Called when search term changes */
  onSearchChange: (term: string) => void;
  /** Set of active filter IDs */
  activeFilters: Set<string>;
  /** Called when a filter is toggled */
  onFilterToggle: (id: string) => void;
  className?: string;
}

// ============================================================================
// EDITOR VIEW COMPONENT
// ============================================================================

/**
 * EditorView - Shared content view for meal creation and editing
 *
 * Layout:
 * 1. Meal name input
 * 2. Slot row (1 main + 3 sides)
 * 3. Search and filter bar
 * 4. Recipe grid
 */
export function EditorView({
  mealName,
  onMealNameChange,
  slots,
  activeSlotIndex,
  onSlotClick,
  onSlotClear,
  onRecipeSelect,
  recipes,
  isLoadingRecipes,
  searchTerm,
  onSearchChange,
  activeFilters,
  onFilterToggle,
  className,
}: EditorViewProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Meal Name Input */}
      <Input
        type="text"
        placeholder="Meal Name"
        value={mealName}
        onChange={(e) => onMealNameChange(e.target.value)}
        className="text-base"
      />

      {/* Slot Row */}
      <div className="grid grid-cols-4 gap-3">
        {/* Main Dish Slot */}
        <MealSlot
          variant="main"
          recipe={slots.main}
          isActive={activeSlotIndex === 0}
          onClick={() => onSlotClick(0)}
          onClear={slots.main ? () => onSlotClear(0) : undefined}
        />

        {/* Side Dish Slots */}
        {slots.sides.map((sideRecipe, index) => (
          <MealSlot
            key={index}
            variant="side"
            recipe={sideRecipe}
            isActive={activeSlotIndex === index + 1}
            onClick={() => onSlotClick(index + 1)}
            onClear={sideRecipe ? () => onSlotClear(index + 1) : undefined}
          />
        ))}
      </div>

      {/* Search and Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        activeFilters={activeFilters}
        onFilterToggle={onFilterToggle}
      />

      {/* Recipe Grid */}
      <RecipeGrid
        recipes={recipes}
        onRecipeSelect={onRecipeSelect}
        isLoading={isLoadingRecipes}
      />
    </div>
  );
}
