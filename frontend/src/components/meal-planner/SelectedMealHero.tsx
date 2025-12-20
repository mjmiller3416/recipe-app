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
 * SelectedMealHero - Fills available space exactly, no overflow
 * 
 * Layout:
 * - Header (shrink-0)
 * - Hero image (flex-1, fills remaining vertical space)
 * - Info section (shrink-0)
 * - Side dishes grid (shrink-0)
 * - Action buttons (shrink-0)
 */
export function SelectedMealHero({
  meal,
  onToggleComplete,
  onRemove,
  onEdit,
}: SelectedMealHeroProps) {
  const { mainRecipe, sideRecipes, completed } = meal;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <h1 className="text-lg font-semibold text-foreground mb-3 shrink-0">
        Selected Meal
      </h1>

      {/* Hero Image - Takes available space */}
      <div className="flex-1 min-h-0 mb-3">
        <div className="relative rounded-2xl overflow-hidden h-full w-full">
          <RecipeImage
            src={mainRecipe.imageUrl}
            alt={mainRecipe.name}
            fill
            className={cn("object-cover", completed && "grayscale")}
            priority
          />
          
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

      {/* Recipe Info */}
      <div className="shrink-0 mb-3">
        <h2 className="text-xl font-bold text-foreground mb-1">
          {mainRecipe.name}
        </h2>
        <div className="flex items-center gap-1 text-sm text-muted">
          <span>Servings: {mainRecipe.servings}</span>
          <span className="mx-2">|</span>
          <span>Prep: {formatDuration(mainRecipe.prepTime)}</span>
          <span className="mx-2">|</span>
          <span>Cook: {formatDuration(mainRecipe.cookTime)}</span>
        </div>
        {mainRecipe.tags.length > 0 && (
          <RecipeBadgeGroup className="mt-2">
            {mainRecipe.tags.map((tag) => (
              <RecipeBadge key={tag} label={tag} type="mealType" size="sm" />
            ))}
          </RecipeBadgeGroup>
        )}
      </div>

      {/* Side Dishes - 3 Column Grid */}
      <div className="shrink-0 grid grid-cols-3 gap-3 mb-3">
        {sideRecipes.map((side) => (
          <SideDishCard key={side.id} side={side} />
        ))}
        {Array.from({ length: 3 - sideRecipes.length }).map((_, i) => (
          <EmptySideSlot key={`empty-${i}`} />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="shrink-0 grid grid-cols-3 gap-3">
        <Button
          onClick={onToggleComplete}
          variant={completed ? "outline" : "default"}
          size="sm"
          className={cn(
            "flex items-center justify-center gap-2",
            !completed && "bg-success hover:bg-success/90"
          )}
        >
          <Check className="h-4 w-4" />
          {completed ? "Incomplete" : "Mark Complete"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex items-center justify-center gap-2"
        >
          <Pencil className="h-4 w-4" />
          Edit Meal
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="flex items-center justify-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
        >
          <Trash className="h-4 w-4" />
          Remove
        </Button>
      </div>
    </div>
  );
}

function SideDishCard({ side }: { side: MealSideRecipe }) {
  return (
    <div className="bg-elevated rounded-xl overflow-hidden">
      <div className="aspect-[4/3] relative">
        <RecipeImage src={side.imageUrl} alt={side.name} fill className="object-cover" />
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-foreground truncate">{side.name}</p>
      </div>
    </div>
  );
}

function EmptySideSlot() {
  return (
    <div className="bg-elevated/30 rounded-xl border-2 border-dashed border-border/50">
      <div className="aspect-[4/3] flex items-center justify-center">
        <ChefHat className="h-6 w-6 text-muted/50" />
      </div>
      <div className="p-2">
        <p className="text-xs text-muted/50">No side</p>
      </div>
    </div>
  );
}