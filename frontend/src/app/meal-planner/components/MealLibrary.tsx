"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Plus, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { plannerApi } from "@/lib/api";
import type { MealSelectionResponseDTO } from "@/types/index";
import { MealLibraryCard } from "./MealLibraryCard";
import { MealLibrarySkeleton, MealLibraryHeaderSkeleton } from "./MealLibrarySkeleton";
import { MealLibraryEmpty } from "./MealLibraryEmpty";
import { TagFilterDropdown } from "./TagFilterDropdown";

type FilterTab = "all" | "favorites";

interface MealLibraryProps {
  mealIdsInPlanner: Set<number>;
  onMealAdded: (entry: { meal_id: number; meal_name: string }) => void;
  showToast: (message: string, type: "success" | "error") => void;
  isAtCapacity: boolean;
  onCreateMeal?: () => void;
  onEditMeal?: (meal: MealSelectionResponseDTO) => void;
  refreshTrigger?: number;
}

export function MealLibrary({
  mealIdsInPlanner,
  onMealAdded,
  showToast,
  isAtCapacity,
  onCreateMeal,
  onEditMeal,
  refreshTrigger = 0,
}: MealLibraryProps) {
  // Data state
  const [meals, setMeals] = useState<MealSelectionResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch meals
  const fetchMeals = useCallback(async () => {
    try {
      setError(null);
      const data = await plannerApi.getMeals();
      setMeals(data);
    } catch (err) {
      setError("Failed to load meals");
      console.error("Failed to fetch meals:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and refresh on trigger change
  useEffect(() => {
    fetchMeals();
  }, [fetchMeals, refreshTrigger]);

  // Extract all unique tags from meals
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    meals.forEach((meal) => {
      meal.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [meals]);

  // Filter meals based on search, tab, and tags
  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      // Search filter (by meal name)
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        if (!meal.meal_name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Favorites filter
      if (activeTab === "favorites" && !meal.is_favorite) {
        return false;
      }

      // Tags filter (match ANY selected tag)
      if (selectedTags.length > 0) {
        const mealTags = meal.tags || [];
        if (!selectedTags.some((tag) => mealTags.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  }, [meals, debouncedSearch, activeTab, selectedTags]);

  // Check if any filters are active
  const hasActiveFilters = !!debouncedSearch || activeTab === "favorites" || selectedTags.length > 0;

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setActiveTab("all");
    setSelectedTags([]);
  };

  // Handle add to planner
  const handleAddToPlanner = async (mealId: number) => {
    if (isAtCapacity) {
      showToast("Planner is full (15/15 meals)", "error");
      return;
    }

    try {
      const entry = await plannerApi.addMeal(mealId);
      const meal = meals.find((m) => m.id === mealId);
      onMealAdded({ meal_id: mealId, meal_name: meal?.meal_name || "Meal" });
      showToast(`Added ${meal?.meal_name || "meal"} to planner`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add meal";
      if (message.includes("full") || message.includes("capacity")) {
        showToast("Planner is full (15/15 meals)", "error");
      } else {
        showToast("Failed to add meal. Please try again.", "error");
      }
      console.error("Failed to add meal to planner:", err);
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (mealId: number) => {
    // Optimistic update
    setMeals((prev) =>
      prev.map((meal) =>
        meal.id === mealId ? { ...meal, is_favorite: !meal.is_favorite } : meal
      )
    );

    try {
      await plannerApi.toggleFavorite(mealId);
    } catch (err) {
      // Revert on error
      setMeals((prev) =>
        prev.map((meal) =>
          meal.id === mealId ? { ...meal, is_favorite: !meal.is_favorite } : meal
        )
      );
      showToast("Failed to update favorite", "error");
      console.error("Failed to toggle favorite:", err);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <MealLibraryHeaderSkeleton />
        <div className="mt-4">
          <MealLibrarySkeleton count={5} />
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/10 p-6 text-center">
        <p className="text-sm text-error mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchMeals}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="border-b border-border-subtle p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Meal Library</h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onCreateMeal}
            disabled={!onCreateMeal}
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            type="text"
            placeholder="Search meals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9 bg-elevated border-border-subtle"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            className="h-8"
            onClick={() => setActiveTab("all")}
          >
            All
          </Button>
          <Button
            variant={activeTab === "favorites" ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 gap-1.5",
              activeTab === "favorites" && "bg-error/20 text-error hover:bg-error/30 border-error/30"
            )}
            onClick={() => setActiveTab("favorites")}
          >
            <Heart className={cn("h-3.5 w-3.5", activeTab === "favorites" && "fill-current")} />
            Favorites
          </Button>
          <TagFilterDropdown
            allTags={allTags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>
      </div>

      {/* Meal list */}
      <div className="p-4">
        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border-subtle">
            <span className="text-xs text-muted">
              {filteredMeals.length} of {meals.length} meals
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Meal cards */}
        {filteredMeals.length === 0 ? (
          <MealLibraryEmpty
            hasFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onCreateMeal={onCreateMeal}
          />
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
            {filteredMeals.map((meal) => (
              <MealLibraryCard
                key={meal.id}
                meal={meal}
                isInPlanner={mealIdsInPlanner.has(meal.id)}
                onAddToPlanner={handleAddToPlanner}
                onToggleFavorite={handleToggleFavorite}
                onEdit={onEditMeal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}