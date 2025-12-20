"use client";

import { Clock, Users, ChefHat, Check, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { RecipeBadge, RecipeBadgeGroup } from "@/components/recipe/RecipeBadge";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/quantityUtils";
import type { MealQueueEntry, MealSideRecipe } from "./types";

interface SelectedMealHeroProps {
  meal: MealQueueEntry;
  onToggleComplete: () => void;
  onRemove: () => void;
  onEdit?: () => void;
}

/**
 * SelectedMealHero - Balanced hero section displaying the currently selected meal
 * 
 * Layout fills available space:
 * - Top row: Image (left) + Info (right)
 * - Bottom: Side dishes + Actions
 */
export function SelectedMealHero({
  meal,
  onToggleComplete,
  onRemove,
  onEdit,
}: SelectedMealHeroProps) {
  const { mainRecipe, sideRecipes, completed } = meal;

  return (
    <div className="h-full flex flex-col max-w-4xl">
      {/* Section Header */}
      <h1 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4 shrink-0">
        Selected Meal
      </h1>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Section: Image + Info */}
        <div className="flex gap-8 mb-6">
          {/* Main Dish Image - Larger, maintains aspect ratio */}
          <div className="w-[400px] shrink-0">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
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
          </div>

          {/* Meal Info */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Meal Name */}
            <h2 className="text-3xl font-bold text-foreground mb-4">
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
            {mainRecipe.tags.length > 0 && (
              <RecipeBadgeGroup className="mb-6">
                {mainRecipe.tags.map((tag) => (
                  <RecipeBadge
                    key={tag}
                    label={tag}
                    type="mealType"
                    size="md"
                  />
                ))}
              </RecipeBadgeGroup>
            )}

            {/* Action Buttons - In the info area */}
            <div className="mt-auto flex flex-wrap gap-3">
              <Button
                onClick={onToggleComplete}
                variant={completed ? "outline" : "default"}
                className={cn(
                  "flex items-center gap-2",
                  !completed && "bg-success hover:bg-success/90"
                )}
              >
                <Check className="h-4 w-4" />
                {completed ? "Mark Incomplete" : "Mark Complete"}
              </Button>

              <Button
                variant="outline"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit Meal
              </Button>

              <Button
                variant="outline"
                onClick={onRemove}
                className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>

        {/* Side Dishes Section */}
        <div className="shrink-0">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Side Dishes
          </h3>
          <div className="flex gap-4">
            {sideRecipes.map((side) => (
              <SideDishCard key={side.id} side={side} />
            ))}
            {/* Empty slots to show available space */}
            {Array.from({ length: 3 - sideRecipes.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className={cn(
                  "w-32 aspect-[4/3] rounded-xl",
                  "border-2 border-dashed border-border/50",
                  "flex items-center justify-center opacity-40"
                )}
              >
                <ChefHat className="h-8 w-8 text-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SideDishCard - Individual side dish display card
 */
function SideDishCard({ side }: { side: MealSideRecipe }) {
  return (
    <div className="w-32 bg-elevated rounded-xl overflow-hidden">
      <div className="aspect-[4/3] relative overflow-hidden">
        <RecipeImage
          src={side.imageUrl}
          alt={side.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-foreground truncate">
          {side.name}
        </p>
      </div>
    </div>
  );
}