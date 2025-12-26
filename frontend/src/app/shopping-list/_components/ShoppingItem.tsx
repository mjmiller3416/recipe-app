"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
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
 * - Smooth transition for check state
 * - Quantity and unit display
 */
export function ShoppingItem({ item, onToggle }: ShoppingItemProps) {
  const handleClick = () => {
    onToggle(item.id);
  };

  // Format quantity for display (remove trailing zeros)
  const formattedQuantity = item.quantity % 1 === 0
    ? item.quantity.toString()
    : item.quantity.toFixed(2).replace(/\.?0+$/, "");

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer",
        "transition-all duration-200 ease-out",
        "hover:bg-hover/50",
        item.have && "opacity-60"
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

      {/* Item content */}
      <div className="flex-1 flex items-baseline gap-2 min-w-0">
        {/* Ingredient name */}
        <span
          className={cn(
            "text-foreground font-medium truncate transition-all duration-200",
            item.have && "line-through text-muted decoration-muted/50"
          )}
        >
          {item.ingredient_name}
        </span>

        {/* Quantity and unit */}
        <span
          className={cn(
            "text-sm text-muted whitespace-nowrap transition-all duration-200",
            item.have && "text-muted/60"
          )}
        >
          {formattedQuantity}
          {item.unit && ` ${item.unit}`}
        </span>
      </div>

      {/* Source indicator (subtle) */}
      {item.source === "manual" && (
        <span className="text-xs text-muted/50 uppercase tracking-wider">
          added
        </span>
      )}
    </div>
  );
}
