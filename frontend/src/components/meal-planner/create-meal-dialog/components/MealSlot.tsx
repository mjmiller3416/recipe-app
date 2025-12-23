"use client";

import { UtensilsCrossed, Clock, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RecipeCardImage } from "@/components/recipe/RecipeImage";
import { cn } from "@/lib/utils";
import type { RecipeCardData } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface MealSlotProps {
  /** Slot variant - main is larger, side is compact */
  variant: "main" | "side";
  /** Recipe assigned to this slot (null for empty) */
  recipe?: RecipeCardData | null;
  /** Whether this slot is currently active/selected */
  isActive: boolean;
  /** Called when slot is clicked */
  onClick: () => void;
  /** Called when clear button is clicked (only shown when filled) */
  onClear?: () => void;
  className?: string;
}

// ============================================================================
// MEAL SLOT COMPONENT
// ============================================================================

/**
 * MealSlot - Unified slot component for main dish and side dishes
 *
 * Features:
 * - Empty state with dashed border and icon
 * - Filled state with recipe thumbnail and info
 * - Active state with purple highlight border
 * - Clear button on filled slots
 */
export function MealSlot({
  variant,
  recipe,
  isActive,
  onClick,
  onClear,
  className,
}: MealSlotProps) {
  const isMain = variant === "main";
  const label = isMain ? "Main Dish" : "Side Dish";

  // Format time for display
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m prep`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Handle clear button click
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  };

  // Empty state
  if (!recipe) {
    return (
      <Card
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out cursor-pointer",
          "border-dashed border-2",
          "pb-0 pt-0 gap-0",
          // Active state: primary border
          isActive
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-muted hover:border-primary/30 hover:bg-hover",
          // Focus state
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Size variants
          isMain ? "min-h-[120px]" : "min-h-[100px]",
          className
        )}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label={`Select ${label.toLowerCase()} slot`}
        aria-pressed={isActive}
      >
        <div className="flex flex-col items-center justify-center p-4 h-full gap-2">
          <div
            className={cn(
              "p-3 rounded-full transition-colors",
              isActive ? "bg-primary/10" : "bg-muted"
            )}
          >
            <UtensilsCrossed
              className={cn(
                "transition-colors",
                isMain ? "h-8 w-8" : "h-6 w-6",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <span
            className={cn(
              "font-medium transition-colors",
              isMain ? "text-sm" : "text-xs",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        </div>
      </Card>
    );
  }

  // Filled state
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 ease-in-out cursor-pointer",
        "pb-0 pt-0 gap-0",
        // Active state: primary border
        isActive
          ? "border-2 border-primary shadow-lg shadow-primary/10"
          : "border border-border hover:shadow-lg hover:shadow-primary/5 hover:bg-hover",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Size variants
        isMain ? "min-h-[120px]" : "min-h-[100px]",
        className
      )}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${recipe.name} - click to replace`}
      aria-pressed={isActive}
    >
      {/* Clear button */}
      {onClear && (
        <button
          onClick={handleClear}
          className={cn(
            "absolute top-2 right-2 z-10 p-1 rounded-full",
            "bg-background/80 backdrop-blur-sm border border-border",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          )}
          aria-label={`Remove ${recipe.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <div
        className={cn(
          "flex items-center h-full",
          isMain ? "gap-4 p-3" : "gap-3 p-2.5"
        )}
      >
        {/* Recipe Image */}
        <div
          className={cn(
            "relative flex-shrink-0 overflow-hidden rounded-lg bg-elevated",
            isMain ? "w-20 h-20" : "w-14 h-14"
          )}
        >
          <RecipeCardImage
            src={recipe.imageUrl}
            alt={recipe.name}
            className="absolute inset-0 w-full h-full object-cover"
            iconSize={isMain ? "md" : "sm"}
          />
        </div>

        {/* Recipe Info */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors",
              isMain ? "text-sm" : "text-xs"
            )}
          >
            {recipe.name}
          </h4>
          {recipe.totalTime > 0 && (
            <div
              className={cn(
                "flex items-center gap-1 mt-1 text-muted-foreground",
                isMain ? "text-xs" : "text-[10px]"
              )}
            >
              <Clock className={cn(isMain ? "h-3 w-3" : "h-2.5 w-2.5")} />
              <span>{formatTime(recipe.totalTime)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
