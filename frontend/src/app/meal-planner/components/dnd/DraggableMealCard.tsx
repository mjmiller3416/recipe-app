"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { MealSelectionResponseDTO } from "@/types/index";
import { MealLibraryCard } from "../MealLibraryCard";

interface DraggableMealCardProps {
  meal: MealSelectionResponseDTO;
  isInPlanner: boolean;
  onAddToPlanner: (mealId: number) => Promise<void>;
  onToggleFavorite: (mealId: number) => Promise<void>;
  onEdit?: (meal: MealSelectionResponseDTO) => void;
}

export function DraggableMealCard({
  meal,
  isInPlanner,
  onAddToPlanner,
  onToggleFavorite,
  onEdit,
}: DraggableMealCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-meal-${meal.id}`,
    data: {
      type: "library-meal",
      meal,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all duration-200",
        isDragging && "opacity-50 scale-95"
      )}
    >
      <div {...attributes} {...listeners}>
        <MealLibraryCard
          meal={meal}
          isInPlanner={isInPlanner}
          onAddToPlanner={onAddToPlanner}
          onToggleFavorite={onToggleFavorite}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}