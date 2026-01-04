"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { ShoppingCart, Users, Clock } from "lucide-react";

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
  excludeFromShopping?: boolean;
}

interface MealGridCardProps {
  item: MealGridItem;
  isSelected?: boolean;
  onClick?: () => void;
  onToggleExcludeFromShopping?: () => void;
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
  onToggleExcludeFromShopping,
  className,
}: MealGridCardProps) {
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
          {/* Shopping Cart Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExcludeFromShopping?.();
            }}
            className={cn(
              "relative w-6 h-6 rounded-full bg-black/60 flex items-center justify-center",
              "hover:bg-black/80 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
            aria-label={item.excludeFromShopping ? "Include in shopping list" : "Exclude from shopping list"}
          >
            <ShoppingCart
              className={cn(
                "h-3.5 w-3.5",
                item.excludeFromShopping ? "text-destructive" : "text-secondary"
              )}
              strokeWidth={1.5}
            />
            {item.excludeFromShopping && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-4 h-0.5 bg-destructive rotate-[-45deg]" />
              </span>
            )}
          </button>

          {/* Favorite Indicator */}
          {item.isFavorite && (
            <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
              <FavoriteButton
                isFavorite={true}
                onToggle={() => {}}
                readOnly
                size="sm"
                className="h-3.5 w-3.5"
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
