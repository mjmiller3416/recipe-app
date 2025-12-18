"use client";

import { useState } from "react";
import { Plus, Check, Loader2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { MealSelectionResponseDTO } from "@/types/index";

interface MealLibraryCardProps {
  meal: MealSelectionResponseDTO;
  isInPlanner: boolean;
  onAddToPlanner: (mealId: number) => Promise<void>;
  onToggleFavorite: (mealId: number) => Promise<void>;
}

export function MealLibraryCard({
  meal,
  isInPlanner,
  onAddToPlanner,
  onToggleFavorite,
}: MealLibraryCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState(meal.is_favorite);

  const handleAdd = async () => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      await onAddToPlanner(meal.id);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTogglingFavorite) return;
    
    // Optimistic update
    setOptimisticFavorite(!optimisticFavorite);
    setIsTogglingFavorite(true);
    
    try {
      await onToggleFavorite(meal.id);
    } catch {
      // Revert on error
      setOptimisticFavorite(meal.is_favorite);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Update optimistic state when prop changes
  if (meal.is_favorite !== optimisticFavorite && !isTogglingFavorite) {
    setOptimisticFavorite(meal.is_favorite);
  }

  const sideCount = meal.side_recipe_ids?.length || 0;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        "bg-elevated border-border-subtle",
        "hover:border-border hover:bg-hover/50"
      )}
    >
      {/* Header row: meal name + actions */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-foreground text-sm line-clamp-1 flex-1">
          {meal.meal_name}
        </h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Favorite button */}
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-7 w-7 transition-colors",
              optimisticFavorite && "text-error"
            )}
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all",
                optimisticFavorite && "fill-current"
              )}
            />
            <span className="sr-only">
              {optimisticFavorite ? "Remove from favorites" : "Add to favorites"}
            </span>
          </Button>
          
          {/* Add to planner button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted hover:text-primary"
            onClick={handleAdd}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="sr-only">Add to planner</span>
          </Button>
        </div>
      </div>

      {/* Recipe info */}
      <p className="text-xs text-muted mt-1 line-clamp-1">
        Main: {meal.main_recipe?.recipe_name || "No main recipe"}
      </p>
      {sideCount > 0 && (
        <p className="text-xs text-muted">
          + {sideCount} side{sideCount > 1 ? "s" : ""}
        </p>
      )}

      {/* In Planner badge */}
      {isInPlanner && (
        <div className="flex items-center gap-1 mt-1.5">
          <Check className="h-3 w-3 text-success" />
          <span className="text-xs text-success">In Planner</span>
        </div>
      )}

      {/* Tags */}
      {meal.tags && meal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {meal.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary"
            >
              {tag}
            </span>
          ))}
          {meal.tags.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted/20 text-muted">
              +{meal.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}