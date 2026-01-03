"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChefHat, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlannerEntryResponseDTO } from "@/types";

interface MealQueueItemProps {
  entry: PlannerEntryResponseDTO;
  isCompleting: boolean;
  onComplete: (entryId: number) => void;
}

export function MealQueueItem({
  entry,
  isCompleting,
  onComplete,
}: MealQueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    // Combine dnd-kit's transform transition with opacity transition when completing
    // This fixes the fade animation - inline styles override Tailwind classes,
    // so we must include opacity in the transition list explicitly
    transition: isCompleting
      ? `${transition}, opacity 300ms ease-out`
      : transition,
  };

  const imageUrl = entry.main_recipe?.reference_image_path;
  const sideCount = entry.side_recipe_ids?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg bg-elevated hover:bg-hover transition-all duration-300",
        isDragging && "opacity-50 shadow-lg z-10",
        isCompleting && "opacity-0"
      )}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Thumbnail */}
      <div className="relative w-12 h-12 rounded-lg bg-elevated flex-shrink-0 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={entry.meal_name || "Meal"}
            className="w-full h-full object-cover"
          />
        ) : (
          <ChefHat className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-foreground">
          {entry.meal_name || "Unnamed Meal"}
        </p>
        {sideCount > 0 && (
          <p className="text-sm text-muted-foreground">
            + {sideCount} side{sideCount > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Cooked Toggle Icon */}
      <button
        type="button"
        onClick={() => onComplete(entry.id)}
        disabled={isCompleting}
        className={cn(
          "flex-shrink-0 p-1.5 rounded-full transition-colors interactive-subtle",
          isCompleting
            ? "text-success"
            : "text-muted-foreground hover:text-success"
        )}
        aria-label="Mark as cooked"
      >
        {isCompleting ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
