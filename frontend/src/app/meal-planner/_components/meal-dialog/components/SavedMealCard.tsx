"use client";

import { Heart, ChefHat } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { getRecipeEmoji } from "@/lib/recipeEmoji";
import { cn } from "@/lib/utils";
import type { MealSelectionResponseDTO } from "@/types";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format an ISO date string to relative time (e.g., "2 weeks ago")
 */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Today";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} year${diffDays >= 730 ? "s" : ""} ago`;
}

// ============================================================================
// TYPES
// ============================================================================

export interface SavedMealCardProps {
  /** The saved meal data to display */
  meal: MealSelectionResponseDTO;

  /** Called when the card is clicked */
  onSelect?: (meal: MealSelectionResponseDTO) => void;

  /** Whether this card is in a loading/adding state */
  isAdding?: boolean;

  /** Additional class names */
  className?: string;
}

// ============================================================================
// SAVED MEAL CARD COMPONENT
// ============================================================================

/**
 * SavedMealCard - Horizontal card showing a saved meal with side previews
 *
 * Features:
 * - Horizontal layout (image left, content right)
 * - Main dish image with hover zoom
 * - Meal name and main recipe name
 * - Side dish emoji row (using getRecipeEmoji)
 * - Stats: times cooked, last cooked
 * - Click to select action
 * - Disabled/loading state when isAdding
 */
export function SavedMealCard({
  meal,
  onSelect,
  isAdding = false,
  className,
}: SavedMealCardProps) {
  const sideRecipes = meal.side_recipes || [];
  const mainRecipe = meal.main_recipe;

  const handleClick = () => {
    if (!isAdding && onSelect) {
      onSelect(meal);
    }
  };

  return (
    <Card
      interactive
      onClick={handleClick}
      className={cn(
        "overflow-hidden group p-0 gap-0 animate-slide-up",
        isAdding && "opacity-50 pointer-events-none",
        className
      )}
    >
      <div className="flex">
        {/* Main dish image section */}
        <div className="relative w-28 h-28 bg-gradient-to-br from-hover to-elevated flex-shrink-0 overflow-hidden">
          {/* Image with hover zoom */}
          <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300">
            <RecipeImage
              src={mainRecipe?.reference_image_path ?? undefined}
              alt={meal.meal_name}
              fill
              iconSize="md"
              showLoadingState={false}
            />
          </div>
        </div>

        {/* Content section */}
        <div className="flex-1 p-4 min-w-0">
          {/* Meal name */}
          <h3 className="font-semibold text-foreground text-base mb-1 truncate group-hover:text-primary transition-colors">
            {meal.meal_name}
          </h3>

          {/* Main recipe name */}
          {mainRecipe && (
            <p className="text-sm text-muted-foreground mb-2 truncate">
              {mainRecipe.recipe_name}
            </p>
          )}

          {/* Side dish emoji row */}
          <div className="flex items-center gap-2 mb-2">
            {sideRecipes.length > 0 ? (
              sideRecipes.map((side, i) => (
                <span
                  key={i}
                  className="text-lg"
                  title={side.recipe_name}
                >
                  {getRecipeEmoji(side.recipe_name, side.recipe_category ?? undefined)}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground/60">No sides</span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground/80">
            {meal.times_cooked !== null && meal.times_cooked > 0 && (
              <>
                <span className="flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5" />
                  {meal.times_cooked}× cooked
                </span>
                {meal.last_cooked && <span>•</span>}
              </>
            )}
            {meal.last_cooked && (
              <span>{formatRelativeTime(meal.last_cooked)}</span>
            )}
            {!meal.times_cooked && !meal.last_cooked && (
              <span>Never cooked</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
