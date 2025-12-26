"use client";

import { useState } from "react";
import { ShoppingItem } from "./ShoppingItem";
import type { ShoppingItemResponseDTO } from "@/types";
import { cn } from "@/lib/utils";
import {
  ChevronUp,
  Carrot,
  Milk,
  Beef,
  Croissant,
  Package,
  Snowflake,
  Coffee,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// CATEGORY ICON MAPPING
// ============================================================================

interface CategoryConfig {
  icon: LucideIcon;
  bgColor: string;
}

const CATEGORY_ICONS: Record<string, CategoryConfig> = {
  "Produce": { icon: Carrot, bgColor: "bg-green-600" },
  "Dairy & Eggs": { icon: Milk, bgColor: "bg-blue-500" },
  "Meat & Seafood": { icon: Beef, bgColor: "bg-red-500" },
  "Bakery": { icon: Croissant, bgColor: "bg-amber-600" },
  "Pantry": { icon: Package, bgColor: "bg-orange-500" },
  "Frozen": { icon: Snowflake, bgColor: "bg-cyan-500" },
  "Beverages": { icon: Coffee, bgColor: "bg-amber-700" },
  "Other": { icon: ShoppingBag, bgColor: "bg-neutral" },
};

function getCategoryConfig(category: string): CategoryConfig {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS["Other"];
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

  // Get category icon config
  const { icon: Icon, bgColor } = getCategoryConfig(category);

  return (
    <div className="rounded-xl bg-elevated overflow-hidden">
      {/* Category header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hover/30 transition-colors"
      >
        {/* Category icon */}
        <div className={cn("p-2 rounded-lg", bgColor)}>
          <Icon className="h-5 w-5 text-white" />
        </div>

        {/* Category name and count */}
        <div className="flex-1 text-left">
          <h3 className="text-base font-semibold text-foreground">
            {category || "Other"}
          </h3>
          <p className="text-xs text-muted">
            {checkedCount} of {totalItems} items
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
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
