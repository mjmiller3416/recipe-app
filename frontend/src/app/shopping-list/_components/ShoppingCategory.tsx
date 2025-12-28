"use client";

import { useState } from "react";
import { ShoppingItem } from "./ShoppingItem";
import type { ShoppingItemResponseDTO } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";

// ============================================================================
// CATEGORY EMOJI MAPPING
// ============================================================================

const CATEGORY_EMOJIS: Record<string, string> = {
  "Produce": "🥬",
  "Dairy & Eggs": "🧀",
  "Dairy": "🧀",
  "Meat & Seafood": "🥩",
  "Meat": "🥩",
  "Bakery": "🥖",
  "Pantry": "🫙",
  "Frozen": "🧊",
  "Beverages": "🥤",
  "Other": "📦",
};

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS["Other"];
}

// ============================================================================
// COMPONENT
// ============================================================================

interface ShoppingCategoryProps {
  category: string;
  items: ShoppingItemResponseDTO[];
  onToggleItem: (id: number) => void;
}

/**
 * ShoppingCategory - Displays a category section with items
 *
 * Features:
 * - Collapsible card with icon and progress bar
 * - Items sorted alphabetically
 * - Unchecked items at top, checked items at bottom
 */
export function ShoppingCategory({
  category,
  items,
  onToggleItem,
}: ShoppingCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Sort items: alphabetically, with unchecked first
  const sortedItems = [...items].sort((a, b) => {
    // First sort by checked status (unchecked first)
    if (a.have !== b.have) {
      return a.have ? 1 : -1;
    }
    // Then sort alphabetically
    return a.ingredient_name.localeCompare(b.ingredient_name);
  });

  // Calculate progress
  const totalItems = items.length;
  const checkedCount = items.filter((item) => item.have).length;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;
  const isComplete = totalItems > 0 && checkedCount === totalItems;

  // Get category emoji
  const emoji = getCategoryEmoji(category);

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden transition-all duration-200",
        isComplete
          ? "bg-success/5 border border-success/40"
          : "bg-elevated border border-transparent"
      )}
    >
      {/* Category header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-hover/30 transition-colors"
      >
        {/* Category emoji */}
        <span className="text-2xl flex-shrink-0">{emoji}</span>

        {/* Category name and count */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground capitalize">
              {category || "Other"}
            </h3>
            {isComplete && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-semibold">
                Complete
              </span>
            )}
          </div>
          <p className="text-xs text-muted">
            {checkedCount} of {totalItems} items
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-20 sm:w-24 h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-success transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Chevron */}
        <ChevronUp
          className={cn(
            "h-5 w-5 text-muted transition-transform duration-200",
            !isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Items list */}
      {isExpanded && (
        <div className="px-2 pb-2">
          {sortedItems.map((item) => (
            <ShoppingItem
              key={item.id}
              item={item}
              onToggle={onToggleItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
