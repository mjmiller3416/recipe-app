"use client";

import { ShoppingItem } from "./ShoppingItem";
import type { ShoppingItemResponseDTO } from "@/types";

interface ShoppingCategoryProps {
  category: string;
  items: ShoppingItemResponseDTO[];
  onToggleItem: (id: number) => void;
}

/**
 * ShoppingCategory - Displays a category section with items
 *
 * Features:
 * - Category header with item count
 * - Items sorted alphabetically
 * - Unchecked items at top, checked items at bottom with separator
 */
export function ShoppingCategory({
  category,
  items,
  onToggleItem,
}: ShoppingCategoryProps) {
  // Sort items: alphabetically, with unchecked first
  const sortedItems = [...items].sort((a, b) => {
    // First sort by checked status (unchecked first)
    if (a.have !== b.have) {
      return a.have ? 1 : -1;
    }
    // Then sort alphabetically
    return a.ingredient_name.localeCompare(b.ingredient_name);
  });

  const uncheckedItems = sortedItems.filter((item) => !item.have);
  const checkedItems = sortedItems.filter((item) => item.have);
  const hasCheckedItems = checkedItems.length > 0;
  const hasUncheckedItems = uncheckedItems.length > 0;

  // Calculate progress
  const totalItems = items.length;
  const checkedCount = checkedItems.length;

  return (
    <div className="mb-6">
      {/* Category header */}
      <div className="flex items-center gap-3 px-4 py-2 mb-1">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          {category || "Uncategorized"}
        </h3>
        <span className="text-xs text-muted">
          {checkedCount}/{totalItems}
        </span>
        {/* Progress indicator */}
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Unchecked items */}
      <div className="space-y-0.5">
        {uncheckedItems.map((item) => (
          <ShoppingItem
            key={item.id}
            item={item}
            onToggle={onToggleItem}
          />
        ))}
      </div>

      {/* Separator between unchecked and checked */}
      {hasCheckedItems && hasUncheckedItems && (
        <div className="flex items-center gap-3 px-4 py-2 mt-2">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted/60">collected</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>
      )}

      {/* Checked items */}
      {hasCheckedItems && (
        <div className="space-y-0.5">
          {checkedItems.map((item) => (
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
