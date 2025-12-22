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
  onClick?: () => void;
  className?: string;
}

interface SideDishSlotsProps {
  /** Array of recipes for each slot (use null/undefined for empty slots) */
  recipes: (RecipeCardData | null | undefined)[];
  /** Called when any slot is clicked, with the slot index */
  onSlotClick?: (index: number) => void;
  className?: string;
}

// ============================================================================
// SIDE DISH CARD - Internal Component
// ============================================================================

function SideDishCard({ recipe, onClick, className }: SideDishCardProps) {
  // Empty state (No changes needed)
  if (!recipe) {
    return (
      <Card
        className={cn(
          "group cursor-pointer overflow-hidden transition-all duration-200 ease-in-out",
          "hover:shadow-lg hover:shadow-primary/5 hover:bg-hover hover:border-primary/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "border-dashed border-2 border-muted",
          "pb-0 pt-0 gap-0 h-full",
          className
        )}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label="Add side dish"
      >
        <div className="flex items-center justify-center p-6 h-full">
          <div className="flex flex-col items-center gap-2 text-muted group-hover:text-primary transition-colors">
            <Plus className="h-6 w-6" />
            <span className="text-xs font-medium">Add Side</span>
          </div>
        </div>
      </Card>
    );
  }

  // Filled state (UPDATED)
  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-200 ease-in-out",
        "hover:shadow-lg hover:shadow-primary/5 hover:bg-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "pb-0 pt-0 gap-0 h-full",
        className
      )}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${recipe.name} - click to change`}
    >
      <div className="flex items-center gap-4 p-2.5 h-full">
        {/* UPDATED WRAPPER & IMAGE */}
        <div className="relative h-full aspect-square w-auto flex-shrink-0 overflow-hidden rounded-xl bg-elevated">
          <RecipeCardImage
            src={recipe.imageUrl}
            alt={recipe.name}
            // Added 'absolute inset-0' so the image fills the box but doesn't PUSH the box size
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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

export function SideDishSlots({ recipes, onSlotClick, className }: SideDishSlotsProps) {
  // Ensure we always have exactly 3 slots
  const slots = [
    recipes[0] ?? null,
    recipes[1] ?? null,
    recipes[2] ?? null,
  ];

  return (
    <div className={cn("grid grid-cols-3 gap-4 items-stretch auto-rows-[minmax(6.25rem,auto)]", className)}>
      {slots.map((recipe, index) => (
        <SideDishCard
          key={index}
          recipe={recipe}
          onClick={() => onSlotClick?.(index)}
        />
      ))}
    </div>
  );
}