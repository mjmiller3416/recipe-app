"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollableCardList } from "@/components/common/ScrollableCardList";
import { SavedMealCard } from "../components/SavedMealCard";
import { plannerApi } from "@/lib/api";
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

// ============================================================================
// SAVED VIEW COMPONENT
// ============================================================================

/**
 * SavedView - Browse and quick-add saved meals to the planner
 *
 * Click a saved meal to instantly add it to your planner.
 */
export function SavedView({ onEntryCreated }: SavedViewProps) {
  // State
  const [meals, setMeals] = useState<MealSelectionResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    return <SavedViewSkeleton />;
  }

  // Empty state - no meals at all
  if (meals.length === 0) {
    return <EmptyNoMeals />;
  }

  return (
    <ScrollableCardList
      className="min-h-[40vh] max-h-[40vh]"
      innerClassName="grid grid-cols-1 gap-3"
    >
      {meals.map((meal) => (
        <SavedMealCard
          key={meal.id}
          meal={meal}
          isAdding={addingMealId === meal.id}
          onSelect={handleMealClick}
        />
      ))}
    </ScrollableCardList>
  );
}
