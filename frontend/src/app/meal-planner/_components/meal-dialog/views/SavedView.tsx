"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollableCardList } from "@/components/common/ScrollableCardList";
import { SavedMealCard } from "../components/SavedMealCard";
import { plannerApi } from "@/lib/api";
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectGroup,
  MultiSelectSeparator,
} from "@/components/ui/multi-select";
import { MEAL_TYPE_OPTIONS, RECIPE_CATEGORY_OPTIONS, DIETARY_PREFERENCES } from "@/lib/constants";
import { prefixedFiltersToRecipeFilters } from "@/lib/filterUtils";
import type { MealSelectionResponseDTO, PlannerEntryResponseDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface SavedViewProps {
  /** Called when a meal is added to planner */
  onEntryCreated: (entry: PlannerEntryResponseDTO) => void;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function MealCardSkeleton() {
  return (
    <div className="flex bg-elevated rounded-2xl border border-border overflow-hidden">
      <Skeleton className="h-28 w-28 flex-shrink-0" />
      <div className="flex-1 p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

function SavedViewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <MealCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================================================
// EMPTY STATES
// ============================================================================

function EmptyNoMeals() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted">
        <Bookmark className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        No Saved Meals
      </h3>
      <p className="text-muted-foreground mt-1">
        No saved meals yet.
      </p>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
        Save a meal from your planner to reuse it later.
      </p>
    </div>
  );
}

function EmptyNoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted">
        <Search className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        No Meals Found
      </h3>
      <p className="text-muted-foreground mt-1">
        Try adjusting your search or filters.
      </p>
    </div>
  );
}

// ============================================================================
// SAVED VIEW COMPONENT
// ============================================================================

/**
 * SavedView - Browse and quick-add saved meals to the planner
 *
 * Features:
 * - Search by meal name
 * - Filter to favorites only
 * - Click to instantly add meal to planner
 */
export function SavedView({ onEntryCreated }: SavedViewProps) {
  // State
  const [meals, setMeals] = useState<MealSelectionResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [addingMealId, setAddingMealId] = useState<number | null>(null);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------

  useEffect(() => {
    const fetchMeals = async () => {
      setIsLoading(true);
      try {
        const data = await plannerApi.getMeals({ saved: true });
        setMeals(data);
      } catch (error) {
        console.error("Failed to fetch meals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeals();
  }, []);

  // --------------------------------------------------------------------------
  // Filtering (using shared filter utils for parsing)
  // --------------------------------------------------------------------------

  const filteredMeals = useMemo(() => {
    // Use shared utility to parse prefixed filter values
    const filters = prefixedFiltersToRecipeFilters(selectedFilters);

    return meals.filter((meal) => {
      // Search filter
      if (
        searchTerm &&
        !meal.meal_name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      // Meal type filter (OR within group)
      // Note: MealSelectionResponseDTO uses snake_case field names
      if (
        filters.mealTypes && filters.mealTypes.length > 0 &&
        !filters.mealTypes.includes(meal.main_recipe?.meal_type ?? "")
      ) {
        return false;
      }
      // Category filter (OR within group)
      if (
        filters.categories && filters.categories.length > 0 &&
        !filters.categories.includes(meal.main_recipe?.recipe_category ?? "")
      ) {
        return false;
      }
      // Dietary filter (OR within group)
      if (
        filters.dietaryPreferences && filters.dietaryPreferences.length > 0 &&
        !filters.dietaryPreferences.includes(meal.main_recipe?.diet_pref ?? "")
      ) {
        return false;
      }
      return true;
    });
  }, [meals, searchTerm, selectedFilters]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleMealClick = async (meal: MealSelectionResponseDTO) => {
    if (addingMealId !== null) return; // Prevent double-clicks

    setAddingMealId(meal.id);
    try {
      const entry = await plannerApi.addToPlanner(meal.id);
      onEntryCreated(entry);
    } catch (error) {
      console.error("Failed to add meal to planner:", error);
      setAddingMealId(null);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <SavedViewSkeleton />
      </div>
    );
  }

  // Empty state - no meals at all
  if (meals.length === 0) {
    return <EmptyNoMeals />;
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search saved meals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter Dropdown */}
      <MultiSelect values={selectedFilters} onValuesChange={setSelectedFilters}>
        <MultiSelectTrigger className="w-full">
          <MultiSelectValue placeholder="Filter meals..." overflowBehavior="cutoff" />
        </MultiSelectTrigger>
        <MultiSelectContent search={{ placeholder: "Search filters..." }}>
          <MultiSelectGroup heading="Meal Type" columns={2}>
            {MEAL_TYPE_OPTIONS.map((option) => (
              <MultiSelectItem
                key={option.value}
                value={`mealType:${option.value}`}
                badgeLabel={option.label}
              >
                {option.label}
              </MultiSelectItem>
            ))}
          </MultiSelectGroup>
          <MultiSelectSeparator />
          <MultiSelectGroup heading="Category" columns={2}>
            {RECIPE_CATEGORY_OPTIONS.map((option) => (
              <MultiSelectItem
                key={option.value}
                value={`category:${option.value}`}
                badgeLabel={option.label}
              >
                {option.label}
              </MultiSelectItem>
            ))}
          </MultiSelectGroup>
          <MultiSelectSeparator />
          <MultiSelectGroup heading="Dietary" columns={2}>
            {DIETARY_PREFERENCES.filter((d) => d.value !== "none").map((option) => (
              <MultiSelectItem
                key={option.value}
                value={`dietary:${option.value}`}
                badgeLabel={option.label}
              >
                {option.label}
              </MultiSelectItem>
            ))}
          </MultiSelectGroup>
        </MultiSelectContent>
      </MultiSelect>

      {/* Meal List - Fixed height container for consistent dialog size */}
      {filteredMeals.length === 0 ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <EmptyNoResults />
        </div>
      ) : (
        <ScrollableCardList
          className="min-h-[40vh] max-h-[40vh]"
          innerClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {filteredMeals.map((meal) => (
            <SavedMealCard
              key={meal.id}
              meal={meal}
              isAdding={addingMealId === meal.id}
              onSelect={handleMealClick}
            />
          ))}
        </ScrollableCardList>
      )}
    </div>
  );
}
