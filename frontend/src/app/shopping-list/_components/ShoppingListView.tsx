"use client";

import { useEffect, useState, useCallback } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShoppingCategory } from "./ShoppingCategory";
import { shoppingApi } from "@/lib/api";
import type { ShoppingItemResponseDTO, ShoppingListResponseDTO } from "@/types";
import { ShoppingCart, Trash2 } from "lucide-react";

/**
 * StatCard - Individual stat card for the summary section
 */
function StatCard({
  value,
  label,
  colorClass,
}: {
  value: number;
  label: string;
  colorClass: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-elevated/50">
      <span className={`text-3xl font-bold ${colorClass}`}>{value}</span>
      <span className="text-sm text-muted mt-1">{label}</span>
    </div>
  );
}

/**
 * ShoppingListView - Main shopping list page component
 *
 * Features:
 * - Auto-generates shopping list from active planner entries on mount
 * - Groups items by category
 * - Optimistic UI updates for toggling items
 * - Clear completed action
 * - Empty state when no items
 * - Loading skeleton during fetch
 */
export function ShoppingListView() {
  const [shoppingData, setShoppingData] = useState<ShoppingListResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch and generate shopping list on mount
  const loadShoppingList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate from active planner entries
      await shoppingApi.generateFromPlanner();

      // Fetch the updated list
      const data = await shoppingApi.getList();
      setShoppingData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shopping list");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShoppingList();
  }, [loadShoppingList]);

  // Handle toggling an item's checked state
  const handleToggleItem = async (itemId: number) => {
    if (!shoppingData) return;

    // Find the item
    const item = shoppingData.items.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic update
    const previousData = shoppingData;
    setShoppingData({
      ...shoppingData,
      items: shoppingData.items.map((i) =>
        i.id === itemId ? { ...i, have: !i.have } : i
      ),
      checked_items: item.have
        ? shoppingData.checked_items - 1
        : shoppingData.checked_items + 1,
    });

    try {
      await shoppingApi.toggleItem(itemId);
      // Notify other components (e.g., Sidebar) that shopping list changed
      window.dispatchEvent(new Event("shopping-list-updated"));
    } catch (err) {
      // Rollback on error
      setShoppingData(previousData);
      setError(err instanceof Error ? err.message : "Failed to update item");
    }
  };

  // Handle clearing completed items
  const handleClearCompleted = async () => {
    if (!shoppingData) return;

    const previousData = shoppingData;

    // Optimistic update - remove all checked items
    setShoppingData({
      ...shoppingData,
      items: shoppingData.items.filter((i) => !i.have),
      checked_items: 0,
      total_items: shoppingData.total_items - shoppingData.checked_items,
    });

    try {
      await shoppingApi.clearCompleted();
      // Notify other components (e.g., Sidebar) that shopping list changed
      window.dispatchEvent(new Event("shopping-list-updated"));
    } catch (err) {
      // Rollback on error
      setShoppingData(previousData);
      setError(err instanceof Error ? err.message : "Failed to clear completed items");
    }
  };

  // Group items by category
  const groupedItems = shoppingData?.items.reduce<Record<string, ShoppingItemResponseDTO[]>>(
    (acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {}
  ) ?? {};

  // Sort categories alphabetically, but put "Other" at the end
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  const hasItems = shoppingData && shoppingData.items.length > 0;
  const hasCheckedItems = shoppingData && shoppingData.checked_items > 0;

  // Header actions
  const headerActions = hasCheckedItems ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClearCompleted}
      className="text-muted hover:text-destructive"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Clear collected
    </Button>
  ) : null;

  // Loading skeleton
  if (isLoading) {
    return (
      <PageLayout
        title="Shopping List"
        description="Items from your meal plan"
      >
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-1">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout
        title="Shopping List"
        description="Items from your meal plan"
        actions={headerActions}
      >
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-destructive/10 rounded-full mb-4">
            <ShoppingCart className="h-12 w-12 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-muted max-w-sm mb-4">{error}</p>
          <Button onClick={() => loadShoppingList()}>Try Again</Button>
        </div>
      </PageLayout>
    );
  }

  // Empty state
  if (!hasItems) {
    return (
      <PageLayout
        title="Shopping List"
        description="Items from your meal plan"
        actions={headerActions}
      >
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-elevated rounded-full mb-4">
            <ShoppingCart className="h-12 w-12 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Your shopping list is empty
          </h3>
          <p className="text-sm text-muted max-w-sm">
            Add meals to your planner and they&apos;ll appear here as a shopping list.
          </p>
        </div>
      </PageLayout>
    );
  }

  // Calculate remaining items
  const remainingItems = shoppingData.total_items - shoppingData.checked_items;

  return (
    <PageLayout
      title="Shopping List"
      description="Items from your meal plan"
      actions={headerActions}
    >
      {/* Summary stats */}
      <div className="flex gap-3 mb-6">
        <StatCard
          value={shoppingData.total_items}
          label="Total Items"
          colorClass="text-primary"
        />
        <StatCard
          value={shoppingData.checked_items}
          label="Collected"
          colorClass="text-warning"
        />
        <StatCard
          value={remainingItems}
          label="Remaining"
          colorClass="text-success"
        />
      </div>

      {/* Categories list */}
      <ScrollArea className="h-[calc(100vh-35vh)] max-h-[60vh]">
        <div className="space-y-4 pr-4">
          {sortedCategories.map((category) => (
            <ShoppingCategory
              key={category}
              category={category}
              items={groupedItems[category]}
              onToggleItem={handleToggleItem}
            />
          ))}
        </div>
      </ScrollArea>
    </PageLayout>
  );
}
