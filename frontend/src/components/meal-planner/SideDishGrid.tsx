"use client";

import { ChefHat } from "lucide-react";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { cn } from "@/lib/utils";
import type { MealSideRecipe } from "./types";

interface SideDishGridProps {
  sides: MealSideRecipe[];
  maxSides?: number;
  className?: string;
}

/**
 * SideDishGrid - Displays side dishes in a 3-column grid
 * 
 * Shows up to 3 side dishes with images and names.
 * Empty slots are shown as dashed placeholders.
 */
export function SideDishGrid({
  sides,
  maxSides = 3,
  className,
}: SideDishGridProps) {
  // Pad with empty slots to always show 3 positions
  const displaySlots = [...sides, ...Array(maxSides - sides.length).fill(null)].slice(0, maxSides);

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
        Side Dishes
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {displaySlots.map((side, index) =>
          side ? (
            <SideDishCard key={side.id} side={side} />
          ) : (
            <EmptySideSlot key={`empty-${index}`} index={index + 1} />
          )
        )}
      </div>
    </div>
  );
}

interface SideDishCardProps {
  side: MealSideRecipe;
  onClick?: () => void;
}

/**
 * SideDishCard - Individual side dish display card
 */
export function SideDishCard({ side, onClick }: SideDishCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-elevated rounded-xl overflow-hidden transition-all",
        "hover:ring-2 hover:ring-primary/50",
        onClick && "cursor-pointer"
      )}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <RecipeImage
          src={side.imageUrl}
          alt={side.name}
          fill
          className="object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-3">
        <h4 className="text-sm font-medium text-foreground truncate">
          {side.name}
        </h4>
      </div>
    </div>
  );
}

interface EmptySideSlotProps {
  index: number;
}

/**
 * EmptySideSlot - Placeholder for unfilled side dish positions
 */
function EmptySideSlot({ index }: EmptySideSlotProps) {
  return (
    <div
      className={cn(
        "bg-elevated/50 rounded-xl",
        "border-2 border-dashed border-border",
        "flex flex-col items-center justify-center",
        "aspect-[4/3] opacity-40"
      )}
    >
      <ChefHat className="h-8 w-8 text-muted mb-2" />
      <span className="text-xs text-muted">Side {index}</span>
    </div>
  );
}