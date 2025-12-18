"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ShoppingCart, Search, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
} from "@/components/layout/PageHeader";
import { StatsCard } from "@/components/common/StatsCard";
import { Checkbox } from "@/components/ui/checkbox";
import { AddItemForm, type AddItemFormData } from "@/components/forms/AddItemForm";
import { shoppingApi, ApiError } from "@/lib/api";
import type { ShoppingItemResponseDTO } from "@/types";
import { cn } from "@/lib/utils";


interface ShoppingItemProps {
  item: ShoppingItemResponseDTO;
  onToggle: (id: number, checked: boolean) => void;
}

function ShoppingItem({ item, onToggle }: ShoppingItemProps) {
  const itemContent = (
    <div
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors",
        "hover:bg-hover group cursor-pointer",
        item.have && "opacity-60"
      )}
      onClick={() => onToggle(item.id, !item.have)}
    >
      <Checkbox
        checked={item.have}
        onCheckedChange={(checked) => onToggle(item.id, checked === true)}
        onClick={(e) => e.stopPropagation()}
      />
      <span
        className={cn(
          "flex-1 text-sm text-foreground",
          item.have && "line-through text-muted"
        )}
      >
        {item.ingredient_name}: {item.quantity} {item.unit}
      </span>
      {item.source === "manual" && (
        <span className="text-xs text-muted bg-elevated px-2 py-0.5 rounded">
          Manual
        </span>
      )}
    </div>
  );

  return itemContent;
}

export default function ShoppingListPage() {
  // Shopping list state
  const [items, setItems] = useState<ShoppingItemResponseDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch shopping list data
  const fetchShoppingList = useCallback(async () => {
    try {
      setError(null);
      const data = await shoppingApi.getList();
      setItems(data.items);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load shopping list";
      setError(message);
      console.error("Failed to fetch shopping list:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchShoppingList();
  }, [fetchShoppingList]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const filtered = items.filter((item) =>
      item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<string, ShoppingItemResponseDTO[]> = {};
    filtered.forEach((item) => {
      const category = item.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    // Sort categories alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [items, searchTerm]);

  // Get all category names for default expanded state
  const allCategories = useMemo(() => {
    return groupedItems.map(([category]) => category);
  }, [groupedItems]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const checked = items.filter((item) => item.have).length;
    const remaining = total - checked;
    return { total, checked, remaining };
  }, [items]);

  // Handle item toggle
  const handleToggle = useCallback(async (id: number, checked: boolean) => {
    // Optimistic update
    const previousItems = items;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, have: checked } : item))
    );

    try {
      await shoppingApi.toggleItem(id);
    } catch (err) {
      // Rollback on error
      setItems(previousItems);
      console.error("Failed to toggle item:", err);
    }
  }, [items]);

  // Handle add item
  const handleAddItem = useCallback(async (formData: AddItemFormData) => {
    try {
      const newItem = await shoppingApi.addItem({
        ingredient_name: formData.name,
        quantity: formData.quantity,
        unit: formData.unit,
      });
      setItems((prev) => [...prev, newItem]);
    } catch (err) {
      console.error("Failed to add item:", err);
    }
  }, []);

  // Handle clear checked
  const handleClearChecked = useCallback(async () => {
    const checkedItems = items.filter((item) => item.have);
    if (checkedItems.length === 0) return;

    // Optimistic update
    const previousItems = items;
    setItems((prev) => prev.filter((item) => !item.have));

    try {
      await Promise.all(checkedItems.map((item) => shoppingApi.deleteItem(item.id)));
    } catch (err) {
      // Rollback on error
      setItems(previousItems);
      console.error("Failed to clear checked items:", err);
    }
  }, [items]);

  // Handle refresh (regenerate from meal plan)
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchShoppingList();
  }, [fetchShoppingList]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderTitle
              title="Shopping List"
              description="Auto-generated from your meal plan"
            />
          </PageHeaderContent>
        </PageHeader>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted" />
          </div>
        </main>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderTitle
              title="Shopping List"
              description="Auto-generated from your meal plan"
            />
          </PageHeaderContent>
        </PageHeader>
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center rounded-lg border border-error/30 bg-error/10 px-6 py-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-error" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Unable to load shopping list
            </h3>
            <p className="mb-4 text-muted">{error}</p>
            <Button onClick={fetchShoppingList} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle
            title="Shopping List"
            description="Auto-generated from your meal plan"
          />
          <PageHeaderActions>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChecked}
              className="gap-2"
              disabled={stats.checked === 0}
            >
              <Trash2 className="h-4 w-4" />
              Clear Checked
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Shopping List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics Card */}
            <StatsCard
              icon={ShoppingCart}
              primaryValue={stats.remaining}
              primaryLabel="items remaining"
              secondaryValue={`${stats.checked}/${stats.total}`}
              secondaryLabel="completed"
              progress={{ current: stats.checked, total: stats.total }}
            />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Shopping List Accordions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Auto Generated Ingredients
                    </h2>
                    <p className="text-sm text-muted mt-0.5">
                      From this week's meal plan
                    </p>
                  </div>
                </div>

                {groupedItems.length > 0 ? (
                  <Accordion
                    type="multiple"
                    defaultValue={allCategories}
                    className="space-y-2"
                  >
                    {groupedItems.map(([category, categoryItems]) => (
                      <AccordionItem
                        key={category}
                        value={category}
                        className="border border-border rounded-lg overflow-hidden bg-elevated"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline hover:bg-hover">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category}</span>
                            <span className="text-xs text-muted bg-background px-2 py-0.5 rounded-full">
                              {categoryItems.length}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-2 pb-2">
                          <div className="space-y-1">
                            {categoryItems.map((item) => (
                              <ShoppingItem
                                key={item.id}
                                item={item}
                                onToggle={handleToggle}
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-12 text-muted">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items found</p>
                    {searchTerm && (
                      <p className="text-sm mt-1">
                        Try adjusting your search term
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Add Item */}
          <div className="lg:col-span-1">
            <AddItemForm onAddItem={handleAddItem} />
          </div>
        </div>
      </div>
    </div>
  );
}