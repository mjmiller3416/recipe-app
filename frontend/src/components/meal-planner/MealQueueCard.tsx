"use client";

import { Check } from "lucide-react";
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
 * MealQueueCard - Compact card for sidebar meal list
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
        "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all",
        isSelected
          ? "bg-primary/15 ring-2 ring-primary"
          : isCompleted
            ? "bg-elevated/30 opacity-60 hover:opacity-80"
            : "bg-elevated hover:bg-hover"
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "w-12 h-12 rounded-lg overflow-hidden shrink-0 relative",
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

      {/* Name */}
      <span
        className={cn(
          "flex-1 text-sm font-medium truncate min-w-0",
          isCompleted ? "text-muted line-through" : "text-foreground"
        )}
      >
        {meal.name}
      </span>

      {/* Shopping List */}
      <ShoppingListIndicator
        included={meal.includeInShoppingList}
        disabled={isCompleted}
        size="sm"
        onToggle={(e) => {
          e.stopPropagation();
          if (!isCompleted) onToggleShoppingList();
        }}
      />

      {/* Complete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        className={cn(
          "p-1.5 rounded-md transition-all shrink-0",
          isCompleted
            ? "text-success bg-success/20"
            : "text-muted hover:text-success hover:bg-success/10"
        )}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}