"use client";

import { DragOverlay } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { PlannerEntryResponseDTO, MealSelectionResponseDTO } from "@/types/index";

// Types for drag data
export type DragItem =
  | { type: "planner-entry"; entry: PlannerEntryResponseDTO }
  | { type: "library-meal"; meal: MealSelectionResponseDTO };

interface MealDragOverlayProps {
  activeItem: DragItem | null;
}

// Drop animation configuration
const dropAnimationConfig = {
  duration: 250,
  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)", // Slight overshoot
};

// Drag preview for planner entries
function PlannerEntryCardPreview({ entry }: { entry: PlannerEntryResponseDTO }) {
  const mainRecipeName = entry.main_recipe?.recipe_name || "No main recipe";
  const sideCount = entry.side_recipes?.length || 0;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border-2 border-primary bg-elevated",
        "shadow-xl shadow-primary/20",
        "transform rotate-1 scale-105",
        "max-w-[320px]",
        "pointer-events-none"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-muted">{entry.position}.</span>
        <h4 className="font-semibold text-foreground text-sm truncate">
          {entry.meal_name || "Unnamed Meal"}
        </h4>
      </div>
      <p className="text-xs text-muted">Main: {mainRecipeName}</p>
      {sideCount > 0 && (
        <p className="text-xs text-muted">
          + {sideCount} side{sideCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

// Drag preview for library meals
function MealLibraryCardPreview({ meal }: { meal: MealSelectionResponseDTO }) {
  const sideCount = meal.side_recipe_ids?.length || 0;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border-2 border-primary bg-elevated",
        "shadow-xl shadow-primary/20",
        "transform rotate-2 scale-105",
        "max-w-[280px]",
        "pointer-events-none"
      )}
    >
      <h4 className="font-semibold text-foreground text-sm truncate">
        {meal.meal_name}
      </h4>
      <p className="text-xs text-muted mt-1">
        Main: {meal.main_recipe?.recipe_name || "Unknown"}
      </p>
      {sideCount > 0 && (
        <p className="text-xs text-muted">
          + {sideCount} side{sideCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export function MealDragOverlay({ activeItem }: MealDragOverlayProps) {
  if (!activeItem) return null;

  return (
    <DragOverlay dropAnimation={dropAnimationConfig}>
      {activeItem.type === "planner-entry" ? (
        <PlannerEntryCardPreview entry={activeItem.entry} />
      ) : activeItem.type === "library-meal" ? (
        <MealLibraryCardPreview meal={activeItem.meal} />
      ) : null}
    </DragOverlay>
  );
}