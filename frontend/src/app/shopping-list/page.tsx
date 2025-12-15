"use client";

import { useState, useMemo } from "react";
import { ShoppingCart, Search, RefreshCw, Trash2 } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
} from "@/components/PageHeader";
import { StatsCard } from "@/components/StatsCard";
import { Checkbox } from "@/components/ui/checkbox";
import { AddItemForm, type AddItemFormData } from "@/components/AddItemForm";
import { mockShoppingList } from "@/lib/mockData";
import type { ShoppingItemResponseDTO } from "@/types";
import { cn } from "@/lib/utils";

// Mock recipe breakdown data - in production this would come from the API
const mockRecipeBreakdown: Record<string, { recipe_name: string; quantity: number; unit: string | null }[]> = {
  "parmesan_cheese_cup": [
    { recipe_name: "Spaghetti Carbonara", quantity: 0.5, unit: "cup" },
    { recipe_name: "Caesar Salad", quantity: 0.5, unit: "cup" },
  ],
  "olive_oil_tbsp": [
    { recipe_name: "Caprese Salad", quantity: 2, unit: "tbsp" },
    { recipe_name: "Garlic Bread", quantity: 2, unit: "tbsp" },
  ],
  "tomato_whole": [
    { recipe_name: "Caprese Salad", quantity: 2, unit: "whole" },
    { recipe_name: "Tomato Soup", quantity: 2, unit: "whole" },
  ],
  "eggs_whole": [
    { recipe_name: "Spaghetti Carbonara", quantity: 2, unit: "whole" },
    { recipe_name: "French Toast", quantity: 2, unit: "whole" },
  ],
  "bacon_slices": [
    { recipe_name: "Spaghetti Carbonara", quantity: 4, unit: "slices" },
    { recipe_name: "BLT Sandwich", quantity: 4, unit: "slices" },
  ],
};

interface ShoppingItemProps {
  item: ShoppingItemResponseDTO;
  onToggle: (id: number, checked: boolean) => void;
}

function ShoppingItem({ item, onToggle }: ShoppingItemProps) {
  const breakdown = item.state_key ? mockRecipeBreakdown[item.state_key] : null;
  const hasBreakdown = breakdown && breakdown.length > 0;

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

  if (hasBreakdown) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-xs text-foreground mb-2">
              Used in {breakdown.length} recipe{breakdown.length > 1 ? "s" : ""}:
            </p>
            {breakdown.map((recipe, idx) => (
              <p key={idx} className="text-xs text-muted">
                • {recipe.quantity} {recipe.unit} - {recipe.recipe_name}
              </p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return itemContent;
}

export default function ShoppingListPage() {
  // Shopping list state
  const [items, setItems] = useState<ShoppingItemResponseDTO[]>(mockShoppingList.items);
  const [searchTerm, setSearchTerm] = useState("");

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
  const handleToggle = (id: number, checked: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, have: checked } : item))
    );
  };

  // Handle add item
  const handleAddItem = (formData: AddItemFormData) => {
    const newItem: ShoppingItemResponseDTO = {
      id: Date.now(),
      ingredient_name: formData.name,
      quantity: formData.quantity,
      unit: formData.unit,
      category: formData.category,
      source: "manual",
      have: false,
      state_key: null,
    };

    setItems((prev) => [...prev, newItem]);
  };

  // Handle clear checked
  const handleClearChecked = () => {
    setItems((prev) => prev.filter((item) => !item.have));
  };

  // Handle refresh (mock regeneration from meal plan)
  const handleRefresh = () => {
    setItems(mockShoppingList.items);
  };

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
              Regenerate
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