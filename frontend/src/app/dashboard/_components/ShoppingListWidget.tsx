"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { shoppingApi } from "@/lib/api";
import { INGREDIENT_CATEGORY_ORDER } from "@/lib/constants";
import type { ShoppingListResponseDTO } from "@/types";

interface CategoryProgress {
  name: string;
  total: number;
  checked: number;
}

export function ShoppingListWidget() {
  const [shoppingData, setShoppingData] = useState<ShoppingListResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch shopping list data
  const fetchShoppingList = useCallback(async () => {
    try {
      const data = await shoppingApi.getList();
      setShoppingData(data);
    } catch (error) {
      console.error("Failed to fetch shopping list:", error);
    }
  }, []);

  // Fetch on mount and listen for planner updates
  useEffect(() => {
    fetchShoppingList().finally(() => setIsLoading(false));

    window.addEventListener("planner-updated", fetchShoppingList);
    return () => window.removeEventListener("planner-updated", fetchShoppingList);
  }, [fetchShoppingList]);

  // Group items by category and calculate progress
  const categoryProgress = useMemo((): CategoryProgress[] => {
    if (!shoppingData?.items) return [];

    // Group items by category
    const groups: Record<string, { total: number; checked: number }> = {};

    for (const item of shoppingData.items) {
      const category = item.category || "Other";
      if (!groups[category]) {
        groups[category] = { total: 0, checked: 0 };
      }
      groups[category].total++;
      if (item.have) {
        groups[category].checked++;
      }
    }

    // Convert to array and sort by INGREDIENT_CATEGORY_ORDER
    const categories = Object.entries(groups).map(([name, data]) => ({
      name,
      total: data.total,
      checked: data.checked,
    }));

    // Sort by the predefined order
    categories.sort((a, b) => {
      const aIndex = INGREDIENT_CATEGORY_ORDER.indexOf(a.name.toLowerCase() as typeof INGREDIENT_CATEGORY_ORDER[number]);
      const bIndex = INGREDIENT_CATEGORY_ORDER.indexOf(b.name.toLowerCase() as typeof INGREDIENT_CATEGORY_ORDER[number]);

      // Items not in the order go to the end
      const aOrder = aIndex === -1 ? 999 : aIndex;
      const bOrder = bIndex === -1 ? 999 : bIndex;

      return aOrder - bOrder;
    });

    return categories;
  }, [shoppingData]);

  // Calculate overall progress
  const totalItems = shoppingData?.total_items ?? 0;
  const checkedItems = shoppingData?.checked_items ?? 0;
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const hasItems = totalItems > 0;

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border border-border shadow-raised p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Shopping List</h2>
        </div>
        <Link
          href="/shopping-list"
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Open
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex flex-col space-y-4">
          {/* Progress skeleton */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          {/* Category skeletons */}
          <div className="flex-1 divide-y divide-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 first:pt-0">
                <Skeleton className="h-4 w-20" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !hasItems ? (
        <div className="flex-1 flex items-center justify-center text-center text-muted">
          <div>
            <p>No items on your list</p>
            <p className="text-sm mt-1">Add ingredients from recipes to get started!</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col space-y-4">
          {/* Progress Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">
                {checkedItems} of {totalItems} items
              </span>
              <span className="text-sm font-medium text-amber">{progressPercent}%</span>
            </div>
            {/* Progress Bar */}
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="flex-1 min-h-0 overflow-auto divide-y divide-border">
            {categoryProgress.map((category) => {
              const isComplete = category.checked === category.total;
              return (
                <div
                  key={category.name}
                  className="flex items-center justify-between py-3 first:pt-0"
                >
                  <span className="text-sm text-foreground capitalize">
                    {category.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">
                      {category.checked}/{category.total}
                    </span>
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-secondary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
