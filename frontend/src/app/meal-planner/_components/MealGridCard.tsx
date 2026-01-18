"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { ShoppingCart, Users, Clock, Heart } from "lucide-react";
import { ShoppingMode } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

export interface MealGridItem {
  id: number;
  name: string;
  imageUrl: string | null;
  servings?: number | null;
  totalTime?: number | null;
  isFavorite?: boolean;
  shoppingMode?: ShoppingMode;
}

interface MealGridCardProps {
  item: MealGridItem;
  isSelected?: boolean;
  onClick?: () => void;
  onCycleShoppingMode?: () => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/** Get tooltip text explaining the current shopping mode */
function getShoppingModeTooltip(mode: ShoppingMode): string {
  switch (mode) {
    case "all":
      return "All ingredients added to shopping list";
    case "produce_only":
      return "Only produce added to shopping list";
    case "none":
      return "Excluded from shopping list";
  }
}

/** Get aria-label for the shopping mode button */
function getShoppingModeAriaLabel(mode: ShoppingMode): string {
  switch (mode) {
    case "all":
      return "Click to include only produce";
    case "produce_only":
      return "Click to exclude from shopping list";
    case "none":
      return "Click to include all ingredients";
  }
}

// ============================================================================
// MEAL GRID CARD COMPONENT
// ============================================================================

/**
 * Individual meal card for the grid display.
 * Shows recipe image, name, servings, time, and status indicators.
 */
export function MealGridCard({
  item,
  isSelected = false,
  onClick,
  onCycleShoppingMode,
  className,
}: MealGridCardProps) {
  const shoppingMode = item.shoppingMode ?? "all";

  return (
    <Card
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${item.name} - click to view`}
      className={cn(
        // Base styles
        "group cursor-pointer overflow-hidden",
        "pb-0 pt-0 gap-0",
        // Liftable hover effect
        "liftable hover:bg-hover",
        // Focus styles
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Selected state
        isSelected && "ring-2 ring-primary",
        className
      )}
    >
      {/* Image Section */}
      <div className="relative w-full h-28 overflow-hidden bg-elevated">
        <RecipeImage
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          iconSize="md"
          showLoadingState={false}
        />

        {/* Status Icons - Top Right */}
        <div className="absolute top-2 right-2 flex gap-1">
          {/* Shopping Cart Toggle with Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                shape="pill"
                onClick={(e) => {
                  e.stopPropagation();
                  onCycleShoppingMode?.();
                }}
                className="relative size-6 bg-overlay-strong"
                aria-label={getShoppingModeAriaLabel(shoppingMode)}
              >
                <ShoppingCart
                  className={cn(
                    "size-3.5",
                    shoppingMode === "none" && "text-destructive",
                    shoppingMode === "produce_only" && "text-warning",
                    shoppingMode === "all" && "text-secondary"
                  )}
                  strokeWidth={1.5}
                />
                {shoppingMode === "none" && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-4 h-0.5 bg-destructive rotate-[-45deg]" />
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {getShoppingModeTooltip(shoppingMode)}
            </TooltipContent>
          </Tooltip>

          {/* Favorite Indicator */}
          {item.isFavorite && (
            <div className="size-6 rounded-full bg-overlay-strong flex items-center justify-center">
              <Heart
                className="size-3.5 text-destructive fill-current"
                strokeWidth={1.5}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {item.servings != null && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
              {item.servings} servings
            </span>
          )}
          {item.totalTime != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
              {formatTime(item.totalTime)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
