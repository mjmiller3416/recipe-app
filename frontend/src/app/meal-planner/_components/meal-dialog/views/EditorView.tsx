"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MealSlot } from "../components/MealSlot";
import { FilterBar } from "@/components/common/FilterBar";
import { RecipeGrid } from "../components/RecipeGrid";
import { QUICK_FILTERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RecipeCardData } from "@/types";

// Filter pills shown in Create Meal dialog (meal types + new)
const DIALOG_FILTER_IDS = ["breakfast", "lunch", "dinner", "dessert", "sides", "sauce", "new"];
const DIALOG_FILTERS = QUICK_FILTERS.filter((f) => DIALOG_FILTER_IDS.includes(f.id));

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

      {/* Slot Row - p-1 gives active borders and shadows room to render */}
      <div className="grid grid-cols-4 gap-3 p-1">
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
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search recipes by name"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter Pills */}
        <FilterBar
          options={DIALOG_FILTERS}
          activeIds={activeFilters}
          onToggle={onFilterToggle}
          variant="default"
          align="start"
        />
      </div>

      {/* Recipe Grid */}
      <RecipeGrid
        recipes={recipes}
        onRecipeSelect={onRecipeSelect}
        isLoading={isLoadingRecipes}
      />
    </div>
  );
}
