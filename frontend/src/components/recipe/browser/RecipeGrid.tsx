import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeCard, RecipeCardGrid } from "@/components/recipe/RecipeCard";
import type { RecipeCardData } from "@/types/recipe";

export interface RecipeGridProps {
  recipes: RecipeCardData[];
  hasActiveFilters: boolean;
  onRecipeClick: (recipe: RecipeCardData) => void;
  onFavoriteToggle: (recipe: RecipeCardData) => void;
  onClearFilters: () => void;
  /** Select mode configuration */
  selectionMode?: boolean;
  selectedIds?: Set<string | number>;
}

export function RecipeGrid({
  recipes,
  hasActiveFilters,
  onRecipeClick,
  onFavoriteToggle,
  onClearFilters,
  selectionMode = false,
  selectedIds = new Set(),
}: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-elevated rounded-full mb-4">
          <ChefHat className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Recipes Found</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {hasActiveFilters
            ? "Try adjusting your filters or search term to find more recipes."
            : "Your recipe collection is empty. Start by adding some recipes!"}
        </p>
        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear All Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <RecipeCardGrid size="medium">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          size="medium"
          onClick={onRecipeClick}
          onFavoriteToggle={onFavoriteToggle}
          isSelected={selectionMode && selectedIds.has(recipe.id)}
          selectionType={recipe.mealType === "side" ? "side" : "main"}
        />
      ))}
    </RecipeCardGrid>
  );
}
