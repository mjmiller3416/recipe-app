"use client";

import { Plus } from "lucide-react";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { cn } from "@/lib/utils";
import type { SavedMeal } from "./types";

interface SavedMealsDropdownProps {
  meals: SavedMeal[];
  onAddMeal: (id: number) => void;
  className?: string;
}

/**
 * SavedMealsDropdown - Expandable list of saved meals to add to queue
 * 
 * Shows compact cards with:
 * - Thumbnail (main recipe image)
 * - Meal name
 * - Plus button to add to queue
 */
export function SavedMealsDropdown({
  meals,
  onAddMeal,
  className,
}: SavedMealsDropdownProps) {
  if (meals.length === 0) {
    return (
      <div
        className={cn(
          "bg-elevated rounded-xl p-4 text-center",
          className
        )}
      >
        <p className="text-sm text-muted">No saved meals yet</p>
        <p className="text-xs text-muted mt-1">
          Create meals to save them for later
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-elevated rounded-xl p-3 space-y-2 max-h-64 overflow-y-auto",
        className
      )}
    >
      {meals.map((meal) => (
        <SavedMealCard key={meal.id} meal={meal} onAdd={() => onAddMeal(meal.id)} />
      ))}
    </div>
  );
}

interface SavedMealCardProps {
  meal: SavedMeal;
  onAdd: () => void;
}

/**
 * SavedMealCard - Compact card for a saved meal
 */
function SavedMealCard({ meal, onAdd }: SavedMealCardProps) {
  return (
    <button
      onClick={onAdd}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg w-full text-left",
        "bg-hover/50 hover:bg-hover transition-colors"
      )}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
        <RecipeImage
          src={meal.mainRecipeImageUrl}
          alt={meal.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Meal Info */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-foreground truncate block">
          {meal.name}
        </span>
        {meal.sideCount > 0 && (
          <span className="text-xs text-muted">
            +{meal.sideCount} side{meal.sideCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Add Icon */}
      <Plus className="h-4 w-4 text-primary flex-shrink-0" />
    </button>
  );
}