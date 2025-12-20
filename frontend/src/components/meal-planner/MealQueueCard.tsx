"use client";

import { GripVertical, Check } from "lucide-react";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { cn } from "@/lib/utils";
import { ShoppingListIndicator } from "./ShoppingListIndicator";
import type { MealQueueEntry } from "./types";

interface MealQueueCardProps {
  meal: MealQueueEntry;
  isSelected: boolean;
  isCompleted?: boolean;
  onSelect: () => void;
  onToggleShoppingList: () => void;
  onToggleComplete: () => void;
}

/**
 * MealQueueCard - Individual meal card in the queue sidebar
 * 
 * Features:
 * - Thumbnail image
 * - Meal name (truncated)
 * - Shopping list indicator (teal = included, grey + X = excluded)
 * - Completion checkmark
 * - Drag handle (on hover)
 * - Selected state (purple ring)
 * - Completed state (greyed, strikethrough)
 */
export function MealQueueCard({
  meal,
  isSelected,
  isCompleted = false,
  onSelect,
  onToggleShoppingList,
  onToggleComplete,
}: MealQueueCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all",
        isSelected
          ? "bg-primary/20 ring-2 ring-primary"
          : isCompleted
            ? "bg-elevated/30 opacity-60 hover:opacity-80"
            : "bg-elevated hover:bg-hover"
      )}
    >
      {/* Drag Handle - visible on hover */}
      <GripVertical
        className={cn(
          "h-4 w-4 text-muted shrink-0",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "cursor-grab active:cursor-grabbing"
        )}
      />

      {/* Meal Thumbnail */}
      <div
        className={cn(
          "w-10 h-10 rounded-lg overflow-hidden shrink-0 relative",
          isCompleted && "grayscale"
        )}
      >
        <RecipeImage
          src={meal.mainRecipe.imageUrl}
          alt={meal.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Meal Name - flexible, truncates */}
      <span
        className={cn(
          "flex-1 text-sm font-medium truncate min-w-0",
          isCompleted ? "text-muted line-through" : "text-foreground"
        )}
      >
        {meal.name}
      </span>

      {/* Shopping List Indicator - fixed */}
      <ShoppingListIndicator
        included={meal.includeInShoppingList}
        disabled={isCompleted}
        size="sm"
        onToggle={(e) => {
          e.stopPropagation();
          if (!isCompleted) onToggleShoppingList();
        }}
      />

      {/* Completion Checkmark - fixed */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        className={cn(
          "p-1 rounded-md transition-all shrink-0",
          isCompleted
            ? "text-success bg-success/20"
            : "text-muted hover:bg-hover hover:text-success"
        )}
        title={isCompleted ? "Mark as not cooked" : "Mark as cooked"}
        aria-label={isCompleted ? "Mark as not cooked" : "Mark as cooked"}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}