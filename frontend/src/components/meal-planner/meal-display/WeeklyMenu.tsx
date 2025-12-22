"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { Plus } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface MenuListItem {
  id: number;
  name: string;
  imageUrl: string | null;
}

interface MenuListCardProps {
  item: MenuListItem;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

interface WeeklyMenuProps {
  items: MenuListItem[];
  selectedId?: number | null;
  onItemClick?: (item: MenuListItem) => void;
  onAddMealClick?: () => void;
  className?: string;
}

// ============================================================================
// MenuListCard Component
// ============================================================================

export function MenuListCard({
  item,
  isSelected = false,
  onClick,
  className,
}: MenuListCardProps) {
  return (
    <Card
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${item.name} - click to view`}
      className={cn(
        // Base styles (matching SideDishCard)
        "group cursor-pointer overflow-hidden",
        "transition-all duration-200 ease-in-out",
        "pb-0 pt-0 gap-0",
        // Hover styles
        "hover:shadow-lg hover:shadow-primary/5 hover:bg-hover",
        // Focus styles
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Selected state
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className
      )}
    >
      {/* Inner content wrapper (matching SideDishCard layout) */}
      <div className="flex items-center gap-4 p-2.5">
        {/* Thumbnail Image - sized to match SideDishCard height (~100px with padding) */}
        <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-elevated">
          <RecipeImage
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            iconSize="sm"
            showLoadingState={false}
          />
        </div>

        {/* Meal Name */}
        <span className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {item.name}
        </span>
      </div>
    </Card>
  );
}

// ============================================================================
// WeeklyMenu Component
// ============================================================================

export function WeeklyMenu({
  items,
  selectedId,
  onItemClick,
  onAddMealClick,
  className,
}: WeeklyMenuProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full",
        className
      )}
    >
      {/* Header - matching MealPlannerPage "Selected Meal" style */}
      <h2 className="text-xl font-semibold text-foreground mb-4 flex-shrink-0">
        This Week&apos;s Menu
      </h2>

      {/* Scrollable List Area */}
      <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No meals planned yet
          </div>
        ) : (
          items.map((item) => (
            <MenuListCard
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onClick={() => onItemClick?.(item)}
            />
          ))
        )}
      </div>

      {/* Footer - Sticky Add Meal Button */}
      <div className="flex-shrink-0 pt-6">
        <Button
          onClick={onAddMealClick}
          className="w-full"
          size="xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Meal
        </Button>
      </div>
    </div>
  );
}

export default WeeklyMenu;