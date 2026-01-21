"use client";

import { ChefHat, Salad } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeSelectCard } from "@/components/recipe/RecipeSelectCard";
import { cn } from "@/lib/utils";
import type { RecipeCardData } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

export interface RecipeSelectionGridProps {
  /** Array of recipes to display */
  recipes: RecipeCardData[];

  /** ID of the currently selected main dish */
  selectedMainId: string | number | null;

  /** Array of selected side dish IDs */
  selectedSideIds: (string | number)[];

  /** Called when a recipe is selected */
  onRecipeSelect: (recipe: RecipeCardData) => void;

  /** Whether recipes are currently loading */
  isLoading?: boolean;

  /** Whether to show only side dishes */
  showSidesOnly?: boolean;

  /** Additional class names */
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if a recipe is a side dish based on its mealType
 */
function isSideDish(recipe: RecipeCardData): boolean {
  return recipe.mealType === "side";
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="space-y-2 px-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ChefHat className="w-12 h-12 text-muted-foreground/40 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground">
        No recipes found
      </h3>
      <p className="text-sm text-muted-foreground/60 mt-1">
        Try adjusting your search or filters
      </p>
    </div>
  );
}

// ============================================================================
// SECTION HEADER
// ============================================================================

interface SectionHeaderProps {
  icon: typeof ChefHat;
  title: string;
  count: number;
  variant?: "primary" | "secondary";
}

function SectionHeader({ icon: Icon, title, count, variant = "primary" }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Icon className={cn(
        "w-5 h-5",
        variant === "primary" ? "text-primary" : "text-secondary"
      )} />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <Badge variant={variant === "primary" ? "default" : "secondary"} size="sm">
        {count} recipes
      </Badge>
    </div>
  );
}

// ============================================================================
// RECIPE SELECTION GRID COMPONENT
// ============================================================================

/**
 * RecipeSelectionGrid - Grid of selectable recipe cards with Main/Side sections
 *
 * Features:
 * - Uses RecipeSelectCard for all recipe cards
 * - Separates recipes into "Main Dishes" and "Side Dishes" sections
 * - Uses 4-column responsive grid layout
 * - Shows section headers with icons and badge counts
 * - Supports selection state tracking for main and sides
 * - Empty state when no recipes match
 */
export function RecipeSelectionGrid({
  recipes,
  selectedMainId,
  selectedSideIds,
  onRecipeSelect,
  isLoading = false,
  showSidesOnly = false,
  className,
}: RecipeSelectionGridProps) {
  // Separate recipes into main dishes and sides
  const mainDishes = recipes.filter((r) => !isSideDish(r));
  const sideDishes = recipes.filter((r) => isSideDish(r));

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-8", className)}>
        {!showSidesOnly && (
          <div>
            <SectionHeader icon={ChefHat} title="Main Dishes" count={0} />
            <GridSkeleton count={4} />
          </div>
        )}
        <div>
          <SectionHeader icon={Salad} title="Side Dishes" count={0} variant="secondary" />
          <GridSkeleton count={4} />
        </div>
      </div>
    );
  }

  // Empty state
  if (recipes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Main Dishes Section */}
      {!showSidesOnly && mainDishes.length > 0 && (
        <section>
          <SectionHeader icon={ChefHat} title="Main Dishes" count={mainDishes.length} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mainDishes.map((recipe) => (
              <RecipeSelectCard
                key={recipe.id}
                recipe={recipe}
                isSelected={selectedMainId === recipe.id}
                onSelect={onRecipeSelect}
                selectionType="main"
              />
            ))}
          </div>
        </section>
      )}

      {/* Side Dishes Section */}
      {sideDishes.length > 0 && (
        <section>
          <SectionHeader
            icon={Salad}
            title="Side Dishes"
            count={sideDishes.length}
            variant="secondary"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sideDishes.map((recipe) => (
              <RecipeSelectCard
                key={recipe.id}
                recipe={recipe}
                isSelected={selectedSideIds.includes(recipe.id)}
                onSelect={onRecipeSelect}
                selectionType="side"
              />
            ))}
          </div>
        </section>
      )}

      {/* Show empty if filtered to sides only but no sides exist */}
      {showSidesOnly && sideDishes.length === 0 && <EmptyState />}
    </div>
  );
}
