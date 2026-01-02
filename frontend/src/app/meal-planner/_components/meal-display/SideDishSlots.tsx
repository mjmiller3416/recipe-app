"use client";

import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RecipeCardImage } from "@/components/recipe/RecipeImage";
import { cn } from "@/lib/utils";
import type { RecipeCardData } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface SideDishCardProps {
  recipe?: RecipeCardData | null;
  onFilledClick?: () => void;
  onEmptyClick?: () => void;
  className?: string;
}

interface SideDishSlotsProps {
  /** Array of recipes for each slot (use null/undefined for empty slots) */
  recipes: (RecipeCardData | null | undefined)[];
  /** Called when a filled slot is clicked, with the recipe and slot index */
  onFilledSlotClick?: (recipe: RecipeCardData, index: number) => void;
  /** Called when an empty slot is clicked, with the slot index (disabled if not provided) */
  onEmptySlotClick?: (index: number) => void;
  className?: string;
}

// ============================================================================
// SIDE DISH CARD - Internal Component
// ============================================================================

function SideDishCard({ recipe, onFilledClick, onEmptyClick, className }: SideDishCardProps) {
  // Empty state - disabled unless onEmptyClick is provided
  if (!recipe) {
    const isDisabled = !onEmptyClick;
    return (
      <Card
        className={cn(
          "overflow-hidden",
          "border-dashed border-2 border-muted",
          "pb-0 pt-0 gap-0 aspect-[3/1]",
          isDisabled
            ? "opacity-60 cursor-not-allowed"
            : "group cursor-pointer liftable hover:bg-hover hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className
        )}
        onClick={isDisabled ? undefined : onEmptyClick}
        tabIndex={isDisabled ? -1 : 0}
        role="button"
        aria-label="Add side dish"
        aria-disabled={isDisabled}
      >
        <div className="flex items-center justify-center p-6 h-full">
          <div className={cn(
            "flex flex-col items-center gap-2 text-muted transition-colors",
            !isDisabled && "group-hover:text-primary"
          )}>
            <Plus className="h-6 w-6" />
            <span className="text-xs font-medium">Add Side</span>
          </div>
        </div>
      </Card>
    );
  }

  // Filled state - clickable to view recipe
  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden",
        // Liftable provides hover lift, shadow-raised adds depth
        "liftable shadow-raised hover:bg-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "pb-0 pt-0 gap-0 aspect-[3/1]",
        className
      )}
      onClick={onFilledClick}
      tabIndex={0}
      role="button"
      aria-label={`${recipe.name} - click to view`}
    >
      <div className="flex items-center gap-4 p-3 h-full">
        {/* UPDATED WRAPPER & IMAGE */}
        <div className="relative h-full aspect-square w-auto flex-shrink-0 overflow-hidden rounded-xl bg-elevated">
          <RecipeCardImage
            src={recipe.imageUrl}
            alt={recipe.name}
            // Scale-150 zooms the image in for a tighter crop
            className="absolute inset-0 w-full h-full object-cover scale-150"
            iconSize="md"
          />
        </div>

        {/* Recipe Name Only */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {recipe.name}
          </h3>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// SIDE DISH SLOTS - Public Component
// ============================================================================

export function SideDishSlots({ recipes, onFilledSlotClick, onEmptySlotClick, className }: SideDishSlotsProps) {
  // Ensure we always have exactly 3 slots
  const slots = [
    recipes[0] ?? null,
    recipes[1] ?? null,
    recipes[2] ?? null,
  ];

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch auto-rows-auto", className)}>
      {slots.map((recipe, index) => (
        <SideDishCard
          key={index}
          recipe={recipe}
          onFilledClick={recipe ? () => onFilledSlotClick?.(recipe, index) : undefined}
          onEmptyClick={onEmptySlotClick ? () => onEmptySlotClick(index) : undefined}
        />
      ))}
    </div>
  );
}