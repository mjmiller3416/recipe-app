"use client";

import { ChefHat, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyMenuStateProps {
  onCreateMeal?: () => void;
}

/**
 * EmptyMenuState - Shown when the weekly menu has no meals
 *
 * Follows existing empty state patterns from the codebase:
 * - Centered icon
 * - Heading + description
 * - Primary CTA button
 */
export function EmptyMenuState({ onCreateMeal }: EmptyMenuStateProps) {
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
        Start planning your week by creating a new meal.
      </p>

      {/* Action */}
      <Button
        onClick={onCreateMeal}
        className="flex items-center gap-2"
      >
        <Plus className="h-5 w-5" />
        Create New Meal
      </Button>
    </div>
  );
}