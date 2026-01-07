"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingItem } from "./ShoppingItem";
import type { ShoppingItemResponseDTO, IngredientBreakdownDTO } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Storage key prefix for persisting collapsed state
const COLLAPSED_STORAGE_KEY = "shopping-category-collapsed";

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
  onToggleFlagged: (id: number) => void;
  breakdownMap?: Map<string, IngredientBreakdownDTO>;
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
  onToggleFlagged,
  breakdownMap,
}: ShoppingCategoryProps) {
  // Storage key for this specific category
  const storageKey = `${COLLAPSED_STORAGE_KEY}-${category}`;

  // Calculate if category is complete (needed for initial state)
  const isInitiallyComplete =
    items.length > 0 && items.every((item) => item.have);

  // Initialize expanded state from localStorage, but always expand incomplete categories
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return true;

    // If category has unchecked items, always expand (items may have been added)
    if (!isInitiallyComplete) return true;

    // Only respect collapsed localStorage for complete categories
    const stored = localStorage.getItem(storageKey);
    return stored === null ? true : stored !== "collapsed";
  });

  // Track previous complete state to detect when category becomes complete
  const wasComplete = useRef(false);

  // Sort items: flagged first, then unchecked, then alphabetically
  const sortedItems = [...items].sort((a, b) => {
    // First sort by flagged status (flagged first)
    if (a.flagged !== b.flagged) {
      return a.flagged ? -1 : 1;
    }
    // Then sort by checked status (unchecked first)
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

  // Auto-collapse when category becomes complete, auto-expand when items are added
  useEffect(() => {
    if (isComplete && !wasComplete.current) {
      // Category just became complete - collapse it
      setIsExpanded(false);
      localStorage.setItem(storageKey, "collapsed");
    } else if (!isComplete && wasComplete.current) {
      // Category was complete but now has unchecked items - expand it
      setIsExpanded(true);
      localStorage.setItem(storageKey, "expanded");
    }
    wasComplete.current = isComplete;
  }, [isComplete, storageKey]);

  // Persist expanded state changes to localStorage
  const handleToggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    localStorage.setItem(storageKey, newExpanded ? "expanded" : "collapsed");
  };

  // Get category emoji
  const emoji = getCategoryEmoji(category);

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isComplete && "bg-success/5 border-success/40"
      )}
    >
      {/* Category header */}
      <Button
        variant="ghost"
        onClick={handleToggleExpanded}
        className="w-full flex items-center gap-3 px-4 py-4 h-auto justify-start rounded-none"
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
              <Badge variant="success" size="sm">
                Complete
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-normal">
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
            "size-5 text-muted-foreground transition-transform duration-200",
            !isExpanded && "rotate-180"
          )}
        />
      </Button>

      {/* Items list */}
      {isExpanded && (
        <div className="px-2 pb-2">
          {sortedItems.map((item) => (
            <ShoppingItem
              key={item.id}
              item={item}
              onToggle={onToggleItem}
              onToggleFlagged={onToggleFlagged}
              breakdown={breakdownMap?.get(item.ingredient_name.toLowerCase())}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
