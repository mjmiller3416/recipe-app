"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChefHat, CheckCircle2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlannerEntryResponseDTO } from "@/types";

interface MealQueueItemProps {
  entry: PlannerEntryResponseDTO;
  isFirst: boolean;
  isCompleting: boolean;
  isDraggable?: boolean;
  onComplete: (entryId: number) => void;
}

export function MealQueueItem({
  entry,
  isFirst,
  isCompleting,
  isDraggable = true,
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
    transition,
  };

  const imageUrl = entry.main_recipe?.reference_image_path;
  const sideCount = entry.side_recipe_ids?.length || 0;
  const isCompleted = entry.is_completed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg bg-hover/50",
        isDragging && "opacity-50 shadow-lg z-10",
        isCompleting && "opacity-0 transition-opacity duration-300",
        isCompleted && "opacity-60"
      )}
    >
      {/* Drag Handle - only show for draggable items */}
      {isDraggable ? (
        <button
          type="button"
          className="p-1 text-muted hover:text-foreground transition-colors cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      ) : (
        <div className="w-7" /> // Spacer for alignment
      )}

      {/* Thumbnail */}
      <div className="relative w-12 h-12 rounded-lg bg-elevated flex-shrink-0 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={entry.meal_name || "Meal"}
            className="w-full h-full object-cover"
          />
        ) : (
          <ChefHat className="h-6 w-6 text-muted" />
        )}
        {/* Completed checkmark overlay */}
        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Check className="h-5 w-5 text-success" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate transition-colors",
          isCompleted ? "text-muted" : "text-foreground"
        )}>
          {entry.meal_name || "Unnamed Meal"}
        </p>
        {sideCount > 0 && (
          <p className="text-sm text-muted">
            + {sideCount} side{sideCount > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Complete Button - Only on first uncompleted item */}
      {isFirst && !isCompleted && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onComplete(entry.id)}
          className="flex-shrink-0 gap-1.5"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Cooked</span>
        </Button>
      )}
    </div>
  );
}
