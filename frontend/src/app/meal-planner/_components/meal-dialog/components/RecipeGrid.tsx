"use client";

import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollableCardList } from "@/components/common/ScrollableCardList";
import { cn } from "@/lib/utils";
import type { RecipeCardData } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface RecipeGridProps {
  /** Array of recipes to display */
  recipes: RecipeCardData[];
  /** Called when a recipe is selected */
  onRecipeSelect: (recipe: RecipeCardData) => void;
  /** Whether recipes are currently loading */
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

function RecipeGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function RecipeGridEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-muted-foreground">No recipes found</p>
      <p className="text-sm text-muted-foreground mt-1">
        Try adjusting your search or filters
      </p>
    </div>
  );
}

// ============================================================================
// RECIPE GRID COMPONENT
// ============================================================================

/**
 * RecipeGrid - Two-column scrollable grid of recipe cards
 *
 * Features:
 * - Uses RecipeCard 'small' variant
 * - Custom onClick handler for selection
 * - Loading skeleton state
 * - Empty state when no recipes match
 */
export function RecipeGrid({
  recipes,
  onRecipeSelect,
  isLoading = false,
  className,
}: RecipeGridProps) {
  if (isLoading) {
    return <RecipeGridSkeleton />;
  }

  if (recipes.length === 0) {
    return <RecipeGridEmpty />;
  }

  return (
    <ScrollableCardList
      className={cn("max-h-[40vh] scrollbar-overlay", className)}
      innerClassName="grid grid-cols-2 gap-3"
    >
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          size="small"
          onClick={() => onRecipeSelect(recipe)}
          showCategory={false}
          showFavorite={false}
        />
      ))}
    </ScrollableCardList>
  );
}
