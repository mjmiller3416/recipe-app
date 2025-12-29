"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Heart, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CircularImage } from "@/components/common/CircularImage";
import { plannerApi } from "@/lib/api";
import { cn } from "@/lib/utils";
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
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

function SavedViewSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
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
        Create a meal to see it here.
      </p>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
        Switch to the &quot;Create Meal&quot; tab to build your first meal combination.
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
// MEAL CARD
// ============================================================================

interface MealCardProps {
  meal: MealSelectionResponseDTO;
  isAdding: boolean;
  onClick: () => void;
}

function MealCard({ meal, isAdding, onClick }: MealCardProps) {
  const sideCount = meal.side_recipes?.length ?? 0;

  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden transition-all",
        "hover:bg-accent/50 active:scale-[0.99]",
        "p-0 gap-0",
        isAdding && "opacity-50 pointer-events-none"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 p-3">
        <CircularImage
          src={meal.main_recipe?.reference_image_path ?? undefined}
          alt={meal.meal_name}
          size="lg"
          zoom={1.3}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
            {meal.meal_name}
          </h3>
          {sideCount > 0 && (
            <p className="text-xs text-muted-foreground">
              +{sideCount} side{sideCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {meal.is_favorite && (
          <Heart className="h-4 w-4 text-rose-500 fill-rose-500 flex-shrink-0" />
        )}
      </div>
    </Card>
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [addingMealId, setAddingMealId] = useState<number | null>(null);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------

  useEffect(() => {
    const fetchMeals = async () => {
      setIsLoading(true);
      try {
        const data = await plannerApi.getMeals();
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
  // Filtering
  // --------------------------------------------------------------------------

  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      // Search filter
      if (
        searchTerm &&
        !meal.meal_name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      // Favorites filter
      if (showFavoritesOnly && !meal.is_favorite) {
        return false;
      }
      return true;
    });
  }, [meals, searchTerm, showFavoritesOnly]);

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
      {/* Search and Filter Row */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search saved meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Favorites Toggle */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors",
            "border",
            showFavoritesOnly
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-foreground"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              showFavoritesOnly && "fill-primary-foreground"
            )}
          />
          Favorites
        </button>
      </div>

      {/* Meal List */}
      {filteredMeals.length === 0 ? (
        <EmptyNoResults />
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {filteredMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              isAdding={addingMealId === meal.id}
              onClick={() => handleMealClick(meal)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
