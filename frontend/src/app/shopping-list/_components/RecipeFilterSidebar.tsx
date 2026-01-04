"use client";

import { cn } from "@/lib/utils";
import { getRecipeEmoji } from "@/lib/recipeEmoji";
import { Separator } from "@/components/ui/separator";

interface RecipeInfo {
  name: string;
  itemCount: number;
  collectedCount: number;
  isFirstInMeal?: boolean; // True if this recipe starts a new meal grouping
}

interface RecipeFilterSidebarProps {
  recipes: RecipeInfo[];
  manualItemCount: number;
  manualCollectedCount: number;
  activeFilter: string | null;
  onFilterChange: (recipeName: string | null) => void;
}

/**
 * RecipeFilterSidebar - Displays recipes contributing to the shopping list
 *
 * Features:
 * - Lists all recipes with item counts and progress
 * - Click to filter shopping list by recipe
 * - Manual items section at the bottom
 * - Sticky positioning for scroll behavior
 */
export function RecipeFilterSidebar({
  recipes,
  manualItemCount,
  manualCollectedCount,
  activeFilter,
  onFilterChange,
}: RecipeFilterSidebarProps) {
  const handleRecipeClick = (recipeName: string) => {
    // Toggle filter off if clicking the same recipe
    onFilterChange(activeFilter === recipeName ? null : recipeName);
  };

  const handleManualClick = () => {
    onFilterChange(activeFilter === "__manual__" ? null : "__manual__");
  };

  // Don't render if no recipes and no manual items
  if (recipes.length === 0 && manualItemCount === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-card border border-border p-4 flex flex-col max-h-[calc(100vh-8rem)]">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex-shrink-0">
          Recipes in this list
        </h3>

        <div className="flex flex-col gap-2 overflow-y-auto overflow-x-hidden flex-1">
          {recipes.map((recipe, index) => {
            const isActive = activeFilter === recipe.name;
            const emoji = getRecipeEmoji(recipe.name);
            // Show separator before new meal groups (but not the first one)
            const showSeparator = recipe.isFirstInMeal && index > 0;

            return (
              <div key={recipe.name}>
                {showSeparator && <Separator className="my-2" />}
                <button
                  onClick={() => handleRecipeClick(recipe.name)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg text-left w-full",
                    "transition-all duration-150 ease-out",
                    isActive
                      ? "bg-primary/15 border border-primary/50"
                      : "bg-hover border border-transparent hover:translate-x-1"
                  )}
                >
                  {/* Recipe emoji */}
                  <span className="text-xl flex-shrink-0">{emoji}</span>

                  {/* Recipe info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "font-medium text-sm truncate",
                        isActive ? "text-primary" : "text-foreground"
                      )}
                    >
                      {recipe.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {recipe.collectedCount}/{recipe.itemCount} items
                    </div>
                  </div>
                </button>
              </div>
            );
          })}

          {/* Manual items section */}
          {manualItemCount > 0 && (
            <>
              {recipes.length > 0 && (
                <div className="h-px bg-border my-2" />
              )}
              <button
                onClick={handleManualClick}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg text-left w-full",
                  "transition-all duration-150 ease-out",
                  activeFilter === "__manual__"
                    ? "bg-secondary/15 border border-secondary/50"
                    : "bg-hover border border-transparent hover:translate-x-1"
                )}
              >
                {/* Manual emoji */}
                <span className="text-xl flex-shrink-0">✏️</span>

                {/* Manual info */}
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-medium text-sm",
                      activeFilter === "__manual__"
                        ? "text-secondary"
                        : "text-foreground"
                    )}
                  >
                    Manual items
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {manualCollectedCount}/{manualItemCount} items
                  </div>
                </div>
              </button>
            </>
          )}
        </div>
    </div>
  );
}
