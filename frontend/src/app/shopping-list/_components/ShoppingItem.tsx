"use client";

import { Flag } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatQuantity } from "@/lib/quantityUtils";
import type { ShoppingItemResponseDTO, IngredientBreakdownDTO } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ShoppingItemProps {
  item: ShoppingItemResponseDTO;
  onToggle: (id: number) => void;
  onToggleFlagged: (id: number) => void;
  breakdown?: IngredientBreakdownDTO;
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
export function ShoppingItem({ item, onToggle, onToggleFlagged, breakdown }: ShoppingItemProps) {
  const handleClick = () => {
    onToggle(item.id);
  };

  const handleFlagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFlagged(item.id);
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

  // Check if item has multiple recipe sources (for tooltip)
  const hasMultipleRecipes =
    item.source === "recipe" &&
    item.recipe_sources &&
    item.recipe_sources.length > 1;

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
          item.have && "data-[state=checked]:bg-success data-[state=checked]:border-success"
        )}
      />

      {/* Quantity badge */}
      <Badge
        variant={item.have ? "muted" : "secondary"}
        className="whitespace-nowrap"
      >
        {quantityBadge}
      </Badge>

      {/* Item content */}
      <div className="flex-1 min-w-0">
        {/* Ingredient name */}
        <span
          className={cn(
            "text-foreground font-medium block truncate transition-all duration-200",
            item.have && "line-through text-muted-foreground decoration-muted/50"
          )}
        >
          {item.ingredient_name}
        </span>

        {/* Recipe source - with tooltip for multiple recipes */}
        {hasMultipleRecipes && !item.have ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "text-xs text-muted-foreground transition-all duration-200",
                  "cursor-help underline decoration-dotted decoration-muted/50",
                  "inline-block" // Shrink to text width only
                )}
              >
                {getRecipeSourceText()}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="max-w-xs">
              <p className="font-medium mb-1">Used in:</p>
              <ul className="space-y-0.5">
                {breakdown?.recipe_contributions.map((contrib) => (
                  <li key={contrib.recipe_name} className="text-muted-foreground">
                    • {contrib.recipe_name}{contrib.usage_count > 1 ? ` (x${contrib.usage_count})` : ""}: {formatQuantity(contrib.quantity)} {contrib.unit || ""}
                  </li>
                )) ?? item.recipe_sources.map((recipe) => (
                  <li key={recipe} className="text-muted-foreground">
                    • {recipe}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span
            className={cn(
              "text-xs text-muted-foreground block truncate transition-all duration-200",
              item.have && "text-foreground-disabled"
            )}
          >
            {getRecipeSourceText()}
          </span>
        )}
      </div>

      {/* Flag icon - anchored to right */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleFlagClick}
        className={cn(
          "shrink-0",
          item.flagged
            ? "text-warning"
            : "text-muted-foreground/40 hover:text-muted-foreground"
        )}
      >
        <Flag
          className={cn(
            "size-4",
            item.flagged && "fill-warning"
          )}
        />
      </Button>
    </div>
  );
}
