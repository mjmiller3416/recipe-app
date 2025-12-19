"use client";

import { ChefHat, Plus, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyMenuStateProps {
  onCreateMeal?: () => void;
  onBrowseSaved?: () => void;
}

/**
 * EmptyMenuState - Shown when the weekly menu has no meals
 * 
 * Follows existing empty state patterns from the codebase:
 * - Centered icon
 * - Heading + description
 * - Primary and secondary CTAs
 */
export function EmptyMenuState({
  onCreateMeal,
  onBrowseSaved,
}: EmptyMenuStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8 h-full">
      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-elevated flex items-center justify-center mb-6">
        <ChefHat className="h-12 w-12 text-muted" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Your menu is empty
      </h2>

      {/* Description */}
      <p className="text-muted mb-8 max-w-md">
        Start planning your week by creating a new meal or adding from your saved meals.
      </p>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={onCreateMeal}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create New Meal
        </Button>

        <Button
          variant="outline"
          onClick={onBrowseSaved}
          className="flex items-center gap-2"
        >
          <Bookmark className="h-5 w-5" />
          Browse Saved Meals
        </Button>
      </div>
    </div>
  );
}