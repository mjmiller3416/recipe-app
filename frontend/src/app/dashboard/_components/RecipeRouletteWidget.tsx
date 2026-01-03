"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dices, RefreshCw, Clock, Users, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { recipeApi } from "@/lib/api";
import type { RecipeCardDTO } from "@/types";

export function RecipeRouletteWidget() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeCardDTO[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<RecipeCardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  // Pick a random recipe, avoiding the current one if possible
  const pickRandomRecipe = useCallback((recipeList: RecipeCardDTO[], currentId?: number) => {
    if (recipeList.length === 0) return null;
    if (recipeList.length === 1) return recipeList[0];

    // Filter out current recipe to avoid repeats
    const available = currentId
      ? recipeList.filter((r) => r.id !== currentId)
      : recipeList;

    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }, []);

  // Fetch recipes on mount
  useEffect(() => {
    async function fetchRecipes() {
      try {
        const data = await recipeApi.listCards();
        setRecipes(data);
        if (data.length > 0) {
          setCurrentRecipe(pickRandomRecipe(data));
        }
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecipes();
  }, [pickRandomRecipe]);

  // Handle spin button click
  const handleSpin = () => {
    if (recipes.length <= 1 || isSpinning) return;

    setIsSpinning(true);
    // Brief delay for visual feedback
    setTimeout(() => {
      setCurrentRecipe(pickRandomRecipe(recipes, currentRecipe?.id));
      setIsSpinning(false);
    }, 150);
  };

  // Navigate to recipe detail
  const handleViewRecipe = () => {
    if (currentRecipe) {
      router.push(`/recipes/${currentRecipe.id}`);
    }
  };

  // Format time display
  const formatTime = (minutes: number | null): string => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="bg-elevated rounded-xl p-4 border border-border shadow-raised">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Dices className="h-5 w-5 text-chart-4" />
          <h2 className="text-lg font-semibold text-foreground">Recipe Roulette</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSpin}
          disabled={isSpinning || recipes.length <= 1}
          className="h-7 px-2 button-bouncy"
          aria-label="Spin for a new recipe"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1 ${isSpinning ? "animate-spin" : ""}`}
          />
          <span className="text-xs">Spin</span>
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <RouletteWidgetSkeleton />
      ) : recipes.length === 0 ? (
        <EmptyState />
      ) : currentRecipe ? (
        <div
          className={`transition-opacity duration-300 ${isSpinning ? "opacity-0" : "opacity-100"}`}
        >
          {/* Recipe Image */}
          <div
            className="relative aspect-video rounded-lg overflow-hidden bg-background mb-3 cursor-pointer group"
            onClick={handleViewRecipe}
          >
            {currentRecipe.reference_image_path ? (
              <img
                src={currentRecipe.reference_image_path}
                alt={currentRecipe.recipe_name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ChefHat className="h-12 w-12 text-muted" />
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>

          {/* Recipe Info */}
          <h4
            className="text-sm font-semibold text-foreground line-clamp-1 mb-2 cursor-pointer hover:text-primary transition-colors"
            onClick={handleViewRecipe}
          >
            {currentRecipe.recipe_name}
          </h4>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted mb-3">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{currentRecipe.servings ?? "N/A"}</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatTime(currentRecipe.total_time)}</span>
            </div>
          </div>

          {/* View Recipe Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewRecipe}
            className="w-full h-8 text-xs"
          >
            View Recipe
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// Skeleton for loading state
function RouletteWidgetSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
}

// Empty state when no recipes exist
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <ChefHat className="h-10 w-10 text-muted mb-2" />
      <p className="text-sm text-muted">No recipes yet</p>
      <p className="text-xs text-muted mt-1">Add some recipes to spin the wheel!</p>
    </div>
  );
}
