"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingBag, Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuantityInput } from "@/components/forms/QuantityInput";
import { INGREDIENT_UNITS, INGREDIENT_CATEGORIES } from "@/lib/constants";
import { useAddManualItem } from "@/hooks/useShoppingList";
import { ingredientApi } from "@/lib/api";
import {
  useIngredientAutocomplete,
  type AutocompleteIngredient,
} from "@/hooks/useIngredientAutocomplete";
import { cn } from "@/lib/utils";

export function QuickAddWidget() {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState<number | null>(null);
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [availableIngredients, setAvailableIngredients] = useState<AutocompleteIngredient[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const addManualItem = useAddManualItem();

  // Fetch available ingredients on mount
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const ingredients = await ingredientApi.list();
        const transformed: AutocompleteIngredient[] = ingredients.map((ing) => ({
          id: ing.id,
          name: ing.ingredient_name,
          category: ing.ingredient_category,
        }));
        setAvailableIngredients(transformed);
      } catch (error) {
        console.error("Failed to fetch ingredients:", error);
      }
    };
    fetchIngredients();
  }, []);

  const handleIngredientSelect = (ingredient: AutocompleteIngredient) => {
    setItemName(ingredient.name);
    // Auto-fill category from the selected ingredient
    if (ingredient.category) {
      setCategory(ingredient.category);
    }
  };

  const {
    open,
    highlightedIndex,
    setHighlightedIndex,
    items,
    handleSelect,
    handleInputChange,
    handleKeyDown: hookKeyDown,
    handleFocus,
    handleBlur,
  } = useIngredientAutocomplete({
    ingredients: availableIngredients,
    value: itemName,
    onValueChange: setItemName,
    onIngredientSelect: handleIngredientSelect,
  });

  const handleAdd = () => {
    const trimmedName = itemName.trim();
    if (!trimmedName) return;

    addManualItem.mutate(
      {
        ingredient_name: trimmedName,
        quantity: quantity || 1,
        unit: unit || null,
        category: category || null,
      },
      {
        onSuccess: () => {
          setItemName("");
          setQuantity(null);
          setUnit("");
          setCategory("");
        },
      }
    );
  };

  // Custom key handler that adds Enter-to-submit when dropdown is closed
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If dropdown is open, let the hook handle navigation
    if (open && items.length > 0) {
      hookKeyDown(e);
      return;
    }
    // If dropdown is closed and Enter is pressed, submit the form
    if (e.key === "Enter" && itemName.trim()) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card className="p-4 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <ShoppingBag className="h-5 w-5 text-chart-4" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-foreground">Quick Add</h2>
      </div>

      {/* Stacked form */}
      <div className="flex flex-col gap-2">
        {/* Row 1: Qty | Unit | Name */}
        <div className="flex flex-row items-center gap-2">
          <QuantityInput
            value={quantity}
            onChange={setQuantity}
            placeholder="Qty"
            className="w-16"
          />
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="w-20">
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
          {/* Autocomplete input wrapper */}
          <div className="relative flex-1 min-w-0">
            <Input
              value={itemName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={() => handleBlur(listRef)}
              placeholder="Add item..."
              className="w-full"
              disabled={addManualItem.isPending}
              autoComplete="off"
            />
            {/* Dropdown */}
            {open && items.length > 0 && (
              <div
                ref={listRef}
                className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-[150px] overflow-auto p-1"
                role="listbox"
              >
                {items.map((item, index) => (
                  <div
                    key={item.type === "ingredient" ? item.data?.id : "create-new"}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    className={cn(
                      "flex items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-pointer transition-colors duration-150",
                      highlightedIndex === index
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                    onClick={() => handleSelect(index)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {item.type === "ingredient" && item.data ? (
                      <>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.data.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.data.category}
                          </span>
                        </div>
                        {itemName.toLowerCase().trim() === item.data.name.toLowerCase() && (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </>
                    ) : item.type === "create" && item.name ? (
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 shrink-0 text-primary" />
                        <span>
                          Add <span className="font-medium text-primary">&quot;{item.name}&quot;</span>
                        </span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Row 2: Category | Add */}
        <div className="flex flex-row items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="flex-1">
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
            onClick={handleAdd}
            disabled={!itemName.trim() || addManualItem.isPending}
            size="icon"
            aria-label="Add item to shopping list"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
