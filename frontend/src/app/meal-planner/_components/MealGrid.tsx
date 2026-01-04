"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { MealGridCard, MealGridItem } from "./MealGridCard";

// ============================================================================
// TYPES
// ============================================================================

interface MealGridProps {
  items: MealGridItem[];
  selectedId?: number | null;
  onItemClick?: (item: MealGridItem) => void;
  onAddMealClick?: () => void;
  onToggleExcludeFromShopping?: (item: MealGridItem) => void;
  className?: string;
}

// ============================================================================
// ADD MEAL CARD COMPONENT
// ============================================================================

interface AddMealCardProps {
  onClick?: () => void;
}

function AddMealCard({ onClick }: AddMealCardProps) {
  return (
    <Card
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label="Add a new meal"
      className={cn(
        // Match height of meal cards (image h-28 + content ~60px)
        "h-44 cursor-pointer",
        "pb-0 pt-0 gap-0",
        // Dashed border style
        "border-2 border-dashed border-muted",
        // Hover effects
        "hover:border-primary/50 hover:bg-hover",
        "transition-colors duration-150",
        // Focus styles
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground hover:text-primary transition-colors">
        <Plus className="h-6 w-6" strokeWidth={1.5} />
        <span className="text-sm font-medium">Add Meal</span>
      </div>
    </Card>
  );
}

// ============================================================================
// MEAL GRID COMPONENT
// ============================================================================

/**
 * Grid display of meals with an "Add Meal" placeholder.
 * Responsive: 2 columns on mobile, 3 on tablet, 4 on desktop.
 */
export function MealGrid({
  items,
  selectedId,
  onItemClick,
  onAddMealClick,
  onToggleExcludeFromShopping,
  className,
}: MealGridProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Section Header */}
      <h2 className="text-lg font-semibold text-foreground">This Week&apos;s Menu</h2>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <MealGridCard
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            onClick={() => onItemClick?.(item)}
            onToggleExcludeFromShopping={() => onToggleExcludeFromShopping?.(item)}
          />
        ))}

        {/* Add Meal Card */}
        <AddMealCard onClick={onAddMealClick} />
      </div>
    </div>
  );
}
