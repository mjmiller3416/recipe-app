"use client";

import { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCategory } from "./ShoppingCategory";
import {
  usePlannerEntries,
  useMeals,
  useShoppingList,
  useToggleItem,
  useToggleFlagged,
  useAddManualItem,
  useClearManualItems,
  useUnits,
} from "@/hooks/api";
import type { ShoppingItemResponseDTO } from "@/types/shopping";
import { ShoppingCart, Eye, EyeOff, Filter, X, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { QuantityInput } from "@/components/forms/QuantityInput";
import { IngredientAutocomplete } from "@/components/forms/IngredientAutocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";
import { IngredientSourceSidebar } from "./IngredientSourceSidebar";
import { useSettings } from "@/hooks/persistence/useSettings";

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
    <Card className="flex flex-col items-center justify-center flex-1 gap-1 p-4">
      <span className={`text-3xl font-bold ${colorClass}`}>{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </Card>
  );
}

/**
 * AddManualItemForm - Inline form for adding manual items to the shopping list
 * Now with ingredient autocomplete for smart suggestions
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
  const { data: units = [] } = useUnits();

  return (
    <Card className="flex flex-row flex-wrap items-center gap-2 p-3 mb-6">
      <QuantityInput
        value={quantity}
        onChange={setQuantity}
        placeholder="Qty"
        className="w-16"
      />
      <Select value={unit} onValueChange={setUnit}>
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Unit" />
        </SelectTrigger>
        <SelectContent>
          {units.map((u) => (
            <SelectItem key={u.value} value={u.value}>
              {u.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <IngredientAutocomplete
        value={itemName}
        onValueChange={setItemName}
        onCategoryChange={setCategory}
        onSubmit={() => itemName.trim() && onAdd()}
        placeholder="Add item..."
        disabled={isAdding}
        className="min-w-40"
      />
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-28">
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
      <Button
        onClick={onAdd}
        disabled={!itemName.trim() || isAdding}
        size="icon"
        aria-label="Add item to shopping list"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </Card>
  );
}

/**
 * ShoppingListView - Main shopping list page component
 *
 * Features:
 * - Auto-generates shopping list from active planner entries on mount (via auto_generate param)
 * - Groups items by category
 * - Optimistic UI updates for toggling items (via React Query mutations)
 * - Clear completed action
 * - Empty state when no items
 * - Loading skeleton during fetch
 */
export function ShoppingListView() {
  // Settings for category ordering
  const { settings } = useSettings();
  const { categorySortOrder, customCategoryOrder } = settings.shoppingList;

  // React Query hooks for data fetching and mutations
  const { data: shoppingData, isLoading, error, refetch } = useShoppingList();
  const toggleItem = useToggleItem();
  const toggleFlagged = useToggleFlagged();
  const addManualItem = useAddManualItem();
  const clearManualItems = useClearManualItems();
  // Fetch planner entries and meals for recipe ordering (using authenticated hooks)
  const { data: plannerEntries } = usePlannerEntries();
  const { data: allMeals } = useMeals();

  // UI state
  const [filterRecipeName, setFilterRecipeName] = useState<string | null>(null);

  // Manual item form state
  const [manualItemName, setManualItemName] = useState("");
  const [manualItemQty, setManualItemQty] = useState<number | null>(null);
  const [manualItemUnit, setManualItemUnit] = useState<string>("");
  const [manualItemCategory, setManualItemCategory] = useState<string>("");

  // Hide completed items state (persisted to localStorage)
  const [hideCompleted, setHideCompleted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("shopping-list-hide-completed") === "true";
  });

  // Clear manual items dialog state
  const [showClearManualDialog, setShowClearManualDialog] = useState(false);


  // Handle toggling an item's checked state
  const handleToggleItem = (itemId: number) => {
    toggleItem.mutate(itemId);
  };

  // Handle toggling an item's flagged state
  const handleToggleFlagged = (itemId: number) => {
    toggleFlagged.mutate(itemId);
  };

  // Toggle hiding completed items (persisted to localStorage)
  const handleToggleHideCompleted = () => {
    const newValue = !hideCompleted;
    setHideCompleted(newValue);
    localStorage.setItem("shopping-list-hide-completed", String(newValue));
  };

  // Handle adding a manual item
  const handleAddManualItem = () => {
    const trimmedName = manualItemName.trim();
    if (!trimmedName) return;

    addManualItem.mutate(
      {
        ingredient_name: trimmedName,
        quantity: manualItemQty || 1,
        unit: manualItemUnit || null,
        category: manualItemCategory || null,
      },
      {
        onSuccess: () => {
          // Clear form on success
          setManualItemName("");
          setManualItemQty(null);
          setManualItemUnit("");
          setManualItemCategory("");
        },
      }
    );
  };

  // Handle clearing all manual items
  const handleClearManualItems = () => {
    // Compute unchecked manual items directly from data
    const manualItems = shoppingData?.items.filter((i) => i.source === "manual") ?? [];
    const uncheckedManualItems = manualItems.filter((i) => !i.have);

    if (uncheckedManualItems.length > 0) {
      // Show confirmation dialog if there are unchecked manual items
      setShowClearManualDialog(true);
    } else {
      // No unchecked items, proceed directly
      confirmClearManualItems();
    }
  };

  // Confirm and execute clearing manual items
  const confirmClearManualItems = () => {
    setShowClearManualDialog(false);
    clearManualItems.mutate();
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
      for (const source of item.recipe_sources) {
        if (!acc[source.recipe_name]) {
          acc[source.recipe_name] = { itemCount: 0, collectedCount: 0 };
        }
        acc[source.recipe_name].itemCount++;
        if (item.have) {
          acc[source.recipe_name].collectedCount++;
        }
      }
    }
    return acc;
  }, {}) ?? {};

  // Build ordered recipe entries preserving duplicates across meals
  const { orderedRecipeEntries, duplicateRecipeNames } = useMemo(() => {
    const entries: Array<{
      recipeName: string;
      mealId: number;
      isFirstInMeal: boolean;
      instanceKey: string;
    }> = [];
    const recipeNameCounts = new Map<string, number>();

    if (!plannerEntries || !allMeals) return { orderedRecipeEntries: entries, duplicateRecipeNames: new Set<string>() };

    // Sort entries by position (meal planner order)
    // Include entries in "all" or "produce_only" mode (not "none")
    const sortedEntries = [...plannerEntries]
      .filter((e) => e.shopping_mode !== "none" && !e.is_completed)
      .sort((a, b) => a.position - b.position);

    for (const entry of sortedEntries) {
      // Find the full meal data to get side recipes
      const meal = allMeals.find((m) => m.id === entry.meal_id);
      if (!meal) continue;

      // Add main recipe first (mark as first in meal)
      if (meal.main_recipe?.recipe_name) {
        const name = meal.main_recipe.recipe_name;
        entries.push({
          recipeName: name,
          mealId: meal.id,
          isFirstInMeal: true,
          instanceKey: `meal-${meal.id}-${name}`,
        });
        recipeNameCounts.set(name, (recipeNameCounts.get(name) ?? 0) + 1);
      }

      // Add sides in order (always — no dedup guard)
      for (const side of meal.side_recipes || []) {
        if (side.recipe_name) {
          const name = side.recipe_name;
          entries.push({
            recipeName: name,
            mealId: meal.id,
            isFirstInMeal: false,
            instanceKey: `meal-${meal.id}-${name}`,
          });
          recipeNameCounts.set(name, (recipeNameCounts.get(name) ?? 0) + 1);
        }
      }
    }

    // Any recipe appearing in 2+ meals is a duplicate
    const duplicates = new Set<string>();
    for (const [name, count] of recipeNameCounts) {
      if (count > 1) duplicates.add(name);
    }

    return { orderedRecipeEntries: entries, duplicateRecipeNames: duplicates };
  }, [plannerEntries, allMeals]);

  // Build recipes array from ordered entries (already in planner position order)
  const recipes = orderedRecipeEntries
    .filter((entry) => recipeData[entry.recipeName])
    .map((entry) => ({
      name: entry.recipeName,
      itemCount: recipeData[entry.recipeName]?.itemCount ?? 0,
      collectedCount: recipeData[entry.recipeName]?.collectedCount ?? 0,
      isFirstInMeal: entry.isFirstInMeal,
      isDuplicate: duplicateRecipeNames.has(entry.recipeName),
      instanceKey: entry.instanceKey,
    }));

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
    return items.filter((i) =>
      i.recipe_sources?.some((source) => source.recipe_name === filterRecipeName)
    );
  };

  // Normalize category name for comparison (handles slug vs display name mismatches)
  // e.g., "oils-and-vinegars" -> "Oils And Vinegars"
  const normalizeCategoryForComparison = (category: string): string => {
    return category
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Find category index in custom order (handles both exact match and normalized match)
  const findCategoryIndex = (category: string, customOrder: string[]): number => {
    // Try exact match first
    const exactIndex = customOrder.indexOf(category);
    if (exactIndex !== -1) return exactIndex;

    // Try normalized comparison
    const normalizedCategory = normalizeCategoryForComparison(category).toLowerCase();
    return customOrder.findIndex(
      (c) => normalizeCategoryForComparison(c).toLowerCase() === normalizedCategory
    );
  };

  // Sort categories based on user preference
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    // "Other" always goes to the end
    if (a === "Other") return 1;
    if (b === "Other") return -1;

    if (categorySortOrder === "custom" && customCategoryOrder.length > 0) {
      // Use custom order with normalized matching
      const indexA = findCategoryIndex(a, customCategoryOrder);
      const indexB = findCategoryIndex(b, customCategoryOrder);
      // If both are in the custom order, sort by position
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // If only one is in custom order, it comes first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // Neither in custom order - fallback to alphabetical
      return a.localeCompare(b);
    }

    // Default: alphabetical sorting
    return a.localeCompare(b);
  });

  // Filter out categories with no matching items when filter is active
  const visibleCategories = filterRecipeName
    ? sortedCategories.filter((cat) => getFilteredItems(groupedItems[cat]).length > 0)
    : sortedCategories;

  const hasItems = shoppingData && shoppingData.items.length > 0;
  const hasCheckedItems = shoppingData && shoppingData.checked_items > 0;

  // Header actions
  const headerActions = (
    <>
      {/* Clear manual items button - show only when there are manual items */}
      {manualItemCount > 0 && (
        <Button
          variant="outline"
          onClick={handleClearManualItems}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear manual
        </Button>
      )}
      {/* Show toggle button when there are checked items */}
      {hasCheckedItems && (
        <Button
          variant="outline"
          onClick={handleToggleHideCompleted}
        >
          {hideCompleted ? (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Show collected
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide collected
            </>
          )}
        </Button>
      )}
    </>
  );

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
              <Skeleton className="w-24 h-4" />
              <div className="space-y-1">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="w-full h-12 rounded-xl" />
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
          <div className="p-4 mb-4 rounded-full bg-destructive/10">
            <ShoppingCart className="w-12 h-12 text-destructive" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Something went wrong
          </h3>
          <p className="max-w-sm mb-4 text-sm text-muted-foreground">
            {getErrorMessage(error, "Failed to load shopping list")}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
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
          isAdding={addManualItem.isPending}
        />

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 mb-4 rounded-full bg-elevated">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Your shopping list is empty
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
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

  // Get Username for active filter
  const getFilteruserName = () => {
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
        <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full bg-success"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-sm text-right text-muted-foreground tabular-nums min-w-10">
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
        isAdding={addManualItem.isPending}
      />

      {/* Two-column layout: Main content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_clamp(200px,25%,320px)] gap-6">
        {/* Main content column */}
        <div className="min-w-0">
          {/* Active filter indicator */}
          {filterRecipeName && (
            <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-primary/10 border border-primary/30">
              <Filter className="flex-shrink-0 w-4 h-4 text-primary" />
              <span className="text-sm truncate text-primary">
                Filtering by: {getFilteruserName()}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setFilterRecipeName(null)}
                className="ml-auto text-primary"
              >
                <X className="w-4 h-4" />
              </Button>
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
                onToggleFlagged={handleToggleFlagged}
              />
            ))}
          </div>
        </div>

        {/* Recipe filter sidebar (desktop only) - sticky below header */}
        <div className="hidden lg:block">
          <div className="sticky top-28 transform-gpu">
            <IngredientSourceSidebar
              recipes={recipes}
              manualItemCount={manualItemCount}
              manualCollectedCount={manualCollectedCount}
              activeFilter={filterRecipeName}
              onFilterChange={setFilterRecipeName}
            />
          </div>
        </div>
      </div>

      {/* Clear Manual Items Confirmation Dialog */}
      <AlertDialog open={showClearManualDialog} onOpenChange={setShowClearManualDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Manual Items?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {manualItemCount - manualCollectedCount} unchecked manual item{manualItemCount - manualCollectedCount !== 1 ? 's' : ''} that will be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearManualItems}>
              Clear Items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
