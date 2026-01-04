"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { Plus, Check, ShoppingCart, ChefHat } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface MenuListItem {
  id: number;
  name: string;
  imageUrl: string | null;
  isCompleted: boolean;
  isFavorite?: boolean;
  excludeFromShopping?: boolean;
}

interface MenuListCardProps {
  item: MenuListItem;
  isSelected?: boolean;
  onClick?: () => void;
  onToggleExcludeFromShopping?: () => void;
  className?: string;
}

interface WeeklyMenuProps {
  items: MenuListItem[];
  selectedId?: number | null;
  onItemClick?: (item: MenuListItem) => void;
  onAddMealClick?: () => void;
  onCreateMealClick?: () => void;
  onToggleExcludeFromShopping?: (item: MenuListItem) => void;
  className?: string;
}

// ============================================================================
// MenuListCard Component
// ============================================================================

export function MenuListCard({
  item,
  isSelected = false,
  onClick,
  onToggleExcludeFromShopping,
  className,
}: MenuListCardProps) {
  return (
    <Card
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${item.name}${item.isCompleted ? " (completed)" : ""} - click to view`}
      className={cn(
        // Base styles
        "group cursor-pointer",
        "pb-0 pt-0 gap-0",
        // Liftable provides hover lift (Card already has shadow-raised via surface-raised)
        "liftable hover:bg-hover",
        // Focus styles
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Selected state - elevated surface with primary border (no ring gap)
        isSelected && "surface-elevated border-2 border-primary",
        // Completed state - subtle opacity
        item.isCompleted && "opacity-60",
        className
      )}
    >
      {/* Inner content wrapper (matching SideDishCard layout) */}
      <div className="flex items-center gap-4 p-3">
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
          {/* Completed checkmark overlay */}
          {item.isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Check className="h-8 w-8 text-success" />
            </div>
          )}
        </div>

        {/* Meal Name */}
        <span className={cn(
          "flex-1 text-base font-semibold line-clamp-2 transition-colors",
          item.isCompleted ? "text-muted-foreground" : "text-foreground group-hover:text-primary"
        )}>
          {item.name}
        </span>

        {/* Shopping Cart Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExcludeFromShopping?.();
          }}
          className={cn(
            "relative p-1.5 rounded-md interactive-subtle",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            item.excludeFromShopping ? "text-destructive" : "text-success"
          )}
          aria-label={item.excludeFromShopping ? "Include in shopping list" : "Exclude from shopping list"}
        >
          <ShoppingCart className="h-4 w-4" strokeWidth={1.5} />
          {item.excludeFromShopping && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-5 h-0.5 bg-current rotate-[-45deg]" />
            </span>
          )}
        </button>

        {/* Favorite Indicator (read-only) */}
        {item.isFavorite && (
          <FavoriteButton
            isFavorite={true}
            onToggle={() => {}}
            readOnly
            size="sm"
          />
        )}
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
  onCreateMealClick,
  onToggleExcludeFromShopping,
  className,
}: WeeklyMenuProps) {
  // Split items into incomplete and completed
  const incompleteItems = items.filter((item) => !item.isCompleted);
  const completedItems = items.filter((item) => item.isCompleted);

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        className
      )}
    >
      {/* Header */}
      <h2 className="text-xl font-semibold text-foreground mb-4 flex-shrink-0">
        This Week&apos;s Menu
      </h2>

      {/* Scrollable List Area (scrollbar hidden) */}
      <ScrollArea className="flex-1 [&_[data-slot=scroll-area-scrollbar]]:hidden">
        <div className="space-y-4 px-4">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No meals planned yet
            </div>
          ) : (
            <>
              {/* Incomplete meals */}
              {incompleteItems.map((item) => (
                <MenuListCard
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  onClick={() => onItemClick?.(item)}
                  onToggleExcludeFromShopping={() => onToggleExcludeFromShopping?.(item)}
                />
              ))}

              {/* Completed meals section */}
              {completedItems.length > 0 && (
                <>
                  {/* Divider */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Completed
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Completed items */}
                  {completedItems.map((item) => (
                    <MenuListCard
                      key={item.id}
                      item={item}
                      isSelected={selectedId === item.id}
                      onClick={() => onItemClick?.(item)}
                      onToggleExcludeFromShopping={() => onToggleExcludeFromShopping?.(item)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer - Sticky Buttons */}
      <div className="flex-shrink-0 pt-4 flex gap-2">
        <Button
          onClick={onAddMealClick}
          className="flex-1"
          size="xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Meal
        </Button>
        <Button
          onClick={onCreateMealClick}
          variant="outline"
          className="flex-1"
          size="xl"
        >
          <ChefHat className="h-5 w-5 mr-2" />
          Create Meal
        </Button>
      </div>
    </div>
  );
}

export default WeeklyMenu;