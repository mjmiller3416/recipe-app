"use client";

import { useEffect, useState, useCallback } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShoppingCategory } from "./ShoppingCategory";
import { shoppingApi, plannerApi } from "@/lib/api";
import type { ShoppingItemResponseDTO, ShoppingListResponseDTO, IngredientBreakdownDTO } from "@/types";
import { ShoppingCart, Eye, EyeOff, Filter, X, Plus } from "lucide-react";
import { QuantityInput } from "@/components/forms/QuantityInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { INGREDIENT_UNITS, INGREDIENT_CATEGORIES } from "@/lib/constants";
import { RecipeFilterSidebar } from "./RecipeFilterSidebar";

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
 * AddManualItemForm - Inline form for adding manual items to the shopping list
 */
function AddManualItemForm({
  itemName,
  setItemName,
  quantity,
  setQuantity,
  unit,
  setUnit,
  category,
  setCategory,
  onAdd,
  isAdding,
}: {
  itemName: string;
  setItemName: (name: string) => void;
  quantity: number | null;
  setQuantity: (qty: number | null) => void;
  unit: string;
  setUnit: (unit: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  onAdd: () => void;
  isAdding: boolean;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && itemName.trim()) {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 mb-4 rounded-xl border border-border bg-elevated">
      <QuantityInput
        value={quantity}
        onChange={setQuantity}
        placeholder="Qty"
        className="w-16 h-9"
      />
      <Select value={unit} onValueChange={setUnit}>
        <SelectTrigger className="w-24 h-9">
          <SelectValue placeholder="Unit" />
        </SelectTrigger>
        <SelectContent>
          {INGREDIENT_UNITS.map((u) => (
            <SelectItem key={u.value} value={u.value}>
              {u.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-28 h-9">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {INGREDIENT_CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add item..."
        className="flex-1 h-9"
        disabled={isAdding}
      />
      <Button
        onClick={onAdd}
        disabled={!itemName.trim() || isAdding}
        size="sm"
        className="h-9 px-3"
      >
        <Plus className="h-4 w-4" />
      </Button>
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
  const [filterRecipeName, setFilterRecipeName] = useState<string | null>(null);
  const [breakdownMap, setBreakdownMap] = useState<Map<string, IngredientBreakdownDTO>>(new Map());

  // Manual item form state
  const [manualItemName, setManualItemName] = useState("");
  const [manualItemQty, setManualItemQty] = useState<number | null>(null);
  const [manualItemUnit, setManualItemUnit] = useState<string>("");
  const [manualItemCategory, setManualItemCategory] = useState<string>("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Hide completed items state (persisted to localStorage)
  const [hideCompleted, setHideCompleted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("shopping-list-hide-completed") === "true";
  });

  // Fetch and generate shopping list on mount
  const loadShoppingList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate from active planner entries first (must complete before reads)
      await shoppingApi.generateFromPlanner();

      // Fetch list and planner entries in parallel (both are read operations)
      const [data, entries] = await Promise.all([
        shoppingApi.getList(),
        plannerApi.getEntries()
      ]);
      setShoppingData(data);

      // Fetch breakdown data for multi-recipe tooltips
      try {
        const activeEntries = entries.filter(e => !e.is_completed);

        // Extract ALL recipe IDs including duplicates (for accurate usage counting)
        const recipeIds: number[] = [];
        for (const entry of activeEntries) {
          if (entry.main_recipe_id) recipeIds.push(entry.main_recipe_id);
          for (const sideId of entry.side_recipe_ids) {
            recipeIds.push(sideId);
          }
        }

        // Fetch breakdown if we have recipes
        if (recipeIds.length > 0) {
          const breakdown = await shoppingApi.getBreakdown(recipeIds);
          // Create lookup by lowercase ingredient name
          const map = new Map(
            breakdown.map(b => [b.ingredient_name.toLowerCase(), b])
          );
          setBreakdownMap(map);
        }
      } catch {
        // Breakdown fetch failed - continue without it (graceful degradation)
        console.warn("Failed to fetch ingredient breakdown, tooltips will show basic info");
      }
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

  // Toggle hiding completed items (persisted to localStorage)
  const handleToggleHideCompleted = () => {
    const newValue = !hideCompleted;
    setHideCompleted(newValue);
    localStorage.setItem("shopping-list-hide-completed", String(newValue));
  };

  // Handle adding a manual item
  const handleAddManualItem = async () => {
    const trimmedName = manualItemName.trim();
    if (!trimmedName) return;

    setIsAddingItem(true);
    try {
      await shoppingApi.addItem({
        ingredient_name: trimmedName,
        quantity: manualItemQty || 1,
        unit: manualItemUnit || null,
        category: manualItemCategory || null,
      });

      // Clear form
      setManualItemName("");
      setManualItemQty(null);
      setManualItemUnit("");
      setManualItemCategory("");

      // Reload list
      await loadShoppingList();

      // Notify other components
      window.dispatchEvent(new Event("shopping-list-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setIsAddingItem(false);
    }
  };

  // Filter items based on hideCompleted setting, then group by category
  const itemsToShow = hideCompleted
    ? shoppingData?.items.filter((item) => !item.have) ?? []
    : shoppingData?.items ?? [];

  const groupedItems = itemsToShow.reduce<Record<string, ShoppingItemResponseDTO[]>>(
    (acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {}
  );

  // Compute unique recipes from all items for the sidebar
  const recipeData = shoppingData?.items.reduce<
    Record<string, { itemCount: number; collectedCount: number }>
  >((acc, item) => {
    if (item.source === "recipe" && item.recipe_sources) {
      for (const recipeName of item.recipe_sources) {
        if (!acc[recipeName]) {
          acc[recipeName] = { itemCount: 0, collectedCount: 0 };
        }
        acc[recipeName].itemCount++;
        if (item.have) {
          acc[recipeName].collectedCount++;
        }
      }
    }
    return acc;
  }, {}) ?? {};

  // Convert to array and sort alphabetically
  const recipes = Object.entries(recipeData)
    .map(([name, counts]) => ({
      name,
      itemCount: counts.itemCount,
      collectedCount: counts.collectedCount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Count manual items
  const manualItems = shoppingData?.items.filter((i) => i.source === "manual") ?? [];
  const manualItemCount = manualItems.length;
  const manualCollectedCount = manualItems.filter((i) => i.have).length;

  // Filter items based on selected recipe
  const getFilteredItems = (items: ShoppingItemResponseDTO[]) => {
    if (!filterRecipeName) return items;
    if (filterRecipeName === "__manual__") {
      return items.filter((i) => i.source === "manual");
    }
    return items.filter((i) => i.recipe_sources?.includes(filterRecipeName));
  };

  // Sort categories alphabetically, but put "Other" at the end
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  // Filter out categories with no matching items when filter is active
  const visibleCategories = filterRecipeName
    ? sortedCategories.filter((cat) => getFilteredItems(groupedItems[cat]).length > 0)
    : sortedCategories;

  const hasItems = shoppingData && shoppingData.items.length > 0;
  const hasCheckedItems = shoppingData && shoppingData.checked_items > 0;

  // Header actions
  // Show toggle button when there are checked items
  const headerActions = hasCheckedItems ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleHideCompleted}
      className="text-muted hover:text-foreground"
    >
      {hideCompleted ? (
        <>
          <Eye className="h-4 w-4 mr-2" />
          Show collected
        </>
      ) : (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          Hide collected
        </>
      )}
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
        {/* Add manual item form - also available when list is empty */}
        <AddManualItemForm
          itemName={manualItemName}
          setItemName={setManualItemName}
          quantity={manualItemQty}
          setQuantity={setManualItemQty}
          unit={manualItemUnit}
          setUnit={setManualItemUnit}
          category={manualItemCategory}
          setCategory={setManualItemCategory}
          onAdd={handleAddManualItem}
          isAdding={isAddingItem}
        />

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-elevated rounded-full mb-4">
            <ShoppingCart className="h-12 w-12 text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Your shopping list is empty
          </h3>
          <p className="text-sm text-muted max-w-sm">
            Add meals to your planner or use the form above to add items manually.
          </p>
        </div>
      </PageLayout>
    );
  }

  // Calculate remaining items and progress
  const remainingItems = shoppingData.total_items - shoppingData.checked_items;
  const progressPercent =
    shoppingData.total_items > 0
      ? Math.round((shoppingData.checked_items / shoppingData.total_items) * 100)
      : 0;

  // Get display name for active filter
  const getFilterDisplayName = () => {
    if (!filterRecipeName) return null;
    if (filterRecipeName === "__manual__") return "Manual items";
    return filterRecipeName;
  };

  return (
    <PageLayout
      title="Shopping List"
      description="Items from your meal plan"
      actions={headerActions}
    >
      {/* Summary stats */}
      <div className="flex gap-3 mb-4">
        <StatCard
          value={remainingItems}
          label="Remaining"
          colorClass="text-success"
        />
        <StatCard
          value={shoppingData.checked_items}
          label="Collected"
          colorClass="text-warning"
        />
        <StatCard
          value={shoppingData.total_items}
          label="Total Items"
          colorClass="text-primary"
        />
      </div>

      {/* Overall progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-sm text-muted tabular-nums min-w-[40px] text-right">
          {progressPercent}%
        </span>
      </div>

      {/* Add manual item form */}
      <AddManualItemForm
        itemName={manualItemName}
        setItemName={setManualItemName}
        quantity={manualItemQty}
        setQuantity={setManualItemQty}
        unit={manualItemUnit}
        setUnit={setManualItemUnit}
        category={manualItemCategory}
        setCategory={setManualItemCategory}
        onAdd={handleAddManualItem}
        isAdding={isAddingItem}
      />

      {/* Two-column layout: Main content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_clamp(200px,25%,320px)] gap-6">
        {/* Main content column */}
        <div className="min-w-0">
          {/* Active filter indicator */}
          {filterRecipeName && (
            <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-primary/10 border border-primary/30">
              <Filter className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm text-primary truncate">
                Filtering by: {getFilterDisplayName()}
              </span>
              <button
                onClick={() => setFilterRecipeName(null)}
                className="ml-auto p-1 rounded-md hover:bg-primary/20 transition-colors"
              >
                <X className="h-4 w-4 text-primary" />
              </button>
            </div>
          )}

          {/* Categories list - full page scroll */}
          <div className="space-y-4">
            {visibleCategories.map((category) => (
              <ShoppingCategory
                key={category}
                category={category}
                items={getFilteredItems(groupedItems[category])}
                onToggleItem={handleToggleItem}
                breakdownMap={breakdownMap}
              />
            ))}
          </div>
        </div>

        {/* Recipe filter sidebar (desktop only) - sticky below header */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <RecipeFilterSidebar
              recipes={recipes}
              manualItemCount={manualItemCount}
              manualCollectedCount={manualCollectedCount}
              activeFilter={filterRecipeName}
              onFilterChange={setFilterRecipeName}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
