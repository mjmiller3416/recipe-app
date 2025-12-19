"use client";

import { Clock, Users, ChefHat, Check, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { RecipeBadge, RecipeBadgeGroup } from "@/components/recipe/RecipeBadge";
import { cn } from "@/lib/utils";
import { SideDishGrid } from "./SideDishGrid";
import { formatDuration } from "@/lib/quantityUtils";
import type { MealQueueEntry } from "./types";

interface SelectedMealHeroProps {
  meal: MealQueueEntry;
  onToggleComplete: () => void;
  onRemove: () => void;
  onEdit?: () => void;
}

/**
 * SelectedMealHero - Hero section displaying the currently selected meal
 * 
 * Shows:
 * - Large main dish image
 * - Meal name and metadata (servings, prep time, cook time)
 * - Tags
 * - Side dishes grid (max 3)
 * - Action buttons (Mark Complete, Edit, Remove)
 * 
 * Uses existing components:
 * - RecipeImage for image display with fallback
 * - RecipeBadge for tags
 */
export function SelectedMealHero({
  meal,
  onToggleComplete,
  onRemove,
  onEdit,
}: SelectedMealHeroProps) {
  const { mainRecipe, sideRecipes, completed } = meal;

  return (
    <div className="max-w-4xl">
      {/* Section Header */}
      <h1 className="text-lg font-semibold text-muted mb-4">Selected Meal</h1>

      {/* Main Dish Image */}
      <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video">
        <RecipeImage
          src={mainRecipe.imageUrl}
          alt={mainRecipe.name}
          fill
          className={cn("object-cover", completed && "grayscale")}
          priority
        />
        
        {/* Completed overlay */}
        {completed && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-success/20 text-success px-4 py-2 rounded-full flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span className="font-medium">Completed</span>
            </div>
          </div>
        )}
      </div>

      {/* Meal Info */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          {mainRecipe.name}
        </h2>

        {/* Metadata Row */}
        <div className="flex items-center gap-6 text-sm text-muted mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{mainRecipe.servings} servings</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(mainRecipe.prepTime)} prep</span>
          </div>
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            <span>{formatDuration(mainRecipe.cookTime)} cook</span>
          </div>
        </div>

        {/* Tags */}
        <RecipeBadgeGroup>
          {mainRecipe.tags.map((tag) => (
            <RecipeBadge
              key={tag}
              label={tag}
              type="mealType"
              size="md"
            />
          ))}
        </RecipeBadgeGroup>
      </div>

      {/* Side Dishes */}
      <SideDishGrid sides={sideRecipes} />

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <Button
          onClick={onToggleComplete}
          variant={completed ? "outline" : "default"}
          className={cn(
            "flex items-center gap-2",
            !completed && "bg-success hover:bg-success/90"
          )}
        >
          <Check className="h-5 w-5" />
          {completed ? "Mark Incomplete" : "Mark Complete"}
        </Button>

        <Button
          variant="outline"
          onClick={onEdit}
          className="flex items-center gap-2"
        >
          <Pencil className="h-5 w-5" />
          Edit Meal
        </Button>

        <Button
          variant="outline"
          onClick={onRemove}
          className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash className="h-5 w-5" />
          Remove from Menu
        </Button>
      </div>
    </div>
  );
}