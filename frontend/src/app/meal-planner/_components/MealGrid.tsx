"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MealGridCard, MealGridItem } from "./MealGridCard";

// ============================================================================
// TYPES
// ============================================================================

interface MealGridProps {
  items: MealGridItem[];
  selectedId?: number | null;
  onItemClick?: (item: MealGridItem) => void;
  onAddMealClick?: () => void;
  onCycleShoppingMode?: (item: MealGridItem) => void;
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
    <Button
      variant="dashed"
      onClick={onClick}
      aria-label="Add a new meal"
      className="h-44 flex-col gap-2"
    >
      <Plus className="size-6" strokeWidth={1.5} />
      <span>Add Meal</span>
    </Button>
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
  onCycleShoppingMode,
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
            onCycleShoppingMode={() => onCycleShoppingMode?.(item)}
          />
        ))}

        {/* Add Meal Card */}
        <AddMealCard onClick={onAddMealClick} />
      </div>
    </div>
  );
}
