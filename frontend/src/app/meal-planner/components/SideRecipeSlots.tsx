"use client";

import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RecipeSelector } from "./RecipeSelector";
import type { RecipeCardDTO } from "@/types/index";

interface SideRecipeSlotsProps {
  recipes: RecipeCardDTO[];
  sideRecipeIds: number[];
  mainRecipeId: number | null;
  onSideRecipesChange: (ids: number[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
  error?: string;
}

const MAX_SIDES = 3;

export function SideRecipeSlots({
  recipes,
  sideRecipeIds,
  mainRecipeId,
  onSideRecipesChange,
  isLoading = false,
  disabled = false,
  error,
}: SideRecipeSlotsProps) {
  // Get recipe name by ID
  const getRecipeName = (id: number): string => {
    const recipe = recipes.find((r) => r.id === id);
    return recipe?.recipe_name || "Unknown Recipe";
  };

  // IDs to exclude from selector (main recipe + already selected sides)
  const excludeIds = [
    ...(mainRecipeId ? [mainRecipeId] : []),
    ...sideRecipeIds,
  ];

  // Add a new side recipe
  const handleAddSide = (recipeId: number | null) => {
    if (recipeId && sideRecipeIds.length < MAX_SIDES) {
      onSideRecipesChange([...sideRecipeIds, recipeId]);
    }
  };

  // Remove a side recipe
  const handleRemoveSide = (index: number) => {
    const newIds = sideRecipeIds.filter((_, i) => i !== index);
    onSideRecipesChange(newIds);
  };

  const canAddMore = sideRecipeIds.length < MAX_SIDES && !disabled;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Side Recipes
          <span className="text-muted font-normal ml-1">
            ({sideRecipeIds.length}/{MAX_SIDES})
          </span>
        </label>
      </div>

      {/* Filled slots */}
      <div className="space-y-2">
        {sideRecipeIds.map((id, index) => (
          <div
            key={`${id}-${index}`}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg",
              "bg-hover border border-border"
            )}
          >
            <span className="flex-1 text-sm text-foreground truncate">
              {getRecipeName(id)}
            </span>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted hover:text-error shrink-0"
                onClick={() => handleRemoveSide(index)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove side recipe</span>
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add side button/selector */}
      {canAddMore && (
        <RecipeSelector
          recipes={recipes}
          selectedRecipeId={null}
          onSelect={handleAddSide}
          excludeIds={excludeIds}
          placeholder="+ Add side recipe"
          isLoading={isLoading}
          disabled={disabled}
        />
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {/* Helper text */}
      {sideRecipeIds.length === 0 && !canAddMore && (
        <p className="text-xs text-muted">
          Side recipes are optional
        </p>
      )}
    </div>
  );
}