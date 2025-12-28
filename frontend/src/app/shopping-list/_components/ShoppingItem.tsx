"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatQuantity } from "@/lib/quantityUtils";
import type { ShoppingItemResponseDTO } from "@/types";

interface ShoppingItemProps {
  item: ShoppingItemResponseDTO;
  onToggle: (id: number) => void;
}

/**
 * ShoppingItem - Individual shopping list item with checkbox
 *
 * Features:
 * - Click anywhere on the row to toggle
 * - Checked items show strikethrough + faded appearance
 * - Recipe source display ("from Recipe Name" or "from Multiple recipes")
 * - Quantity badge on the right
 */
export function ShoppingItem({ item, onToggle }: ShoppingItemProps) {
  const handleClick = () => {
    onToggle(item.id);
  };

  // Format quantity for display (using fractions like 1/2, 1/4)
  const formattedQuantity = formatQuantity(item.quantity);

  // Format quantity with unit for badge display
  const quantityBadge = item.unit
    ? `${formattedQuantity} ${item.unit}`
    : formattedQuantity;

  // Format recipe source display
  const getRecipeSourceText = () => {
    if (item.source === "manual") {
      return "added manually";
    }
    if (!item.recipe_sources || item.recipe_sources.length === 0) {
      return "from recipe";
    }
    if (item.recipe_sources.length === 1) {
      return `from ${item.recipe_sources[0]}`;
    }
    return "from Multiple recipes";
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer",
        "transition-all duration-150 ease-out",
        item.have
          ? "opacity-60 hover:bg-hover/30"
          : "hover:bg-hover/50 hover:translate-x-1"
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={item.have}
        onCheckedChange={() => onToggle(item.id)}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "transition-all duration-200",
          item.have && "data-[state=checked]:bg-success data-[state=checked]:border-success"
        )}
      />

      {/* Quantity badge */}
      <span
        className={cn(
          "text-sm font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap",
          "transition-all duration-150",
          item.have
            ? "bg-muted/50 text-muted"
            : "bg-primary/20 text-primary"
        )}
      >
        {quantityBadge}
      </span>

      {/* Item content */}
      <div className="flex-1 min-w-0">
        {/* Ingredient name */}
        <span
          className={cn(
            "text-foreground font-medium block truncate transition-all duration-200",
            item.have && "line-through text-muted decoration-muted/50"
          )}
        >
          {item.ingredient_name}
        </span>

        {/* Recipe source */}
        <span
          className={cn(
            "text-xs text-muted block truncate transition-all duration-200",
            item.have && "text-foreground-disabled"
          )}
        >
          {getRecipeSourceText()}
        </span>
      </div>
    </div>
  );
}
