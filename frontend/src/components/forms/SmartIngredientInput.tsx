"use client";

import * as React from "react";
import { useRef, useState, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { ingredientApi } from "@/lib/api";
import {
  useIngredientAutocomplete,
  type AutocompleteIngredient,
} from "@/hooks/forms/useIngredientAutocomplete";
import { cn } from "@/lib/utils";

export interface SmartIngredientInputProps {
  /** Current input value (controlled) */
  value: string;
  /** Called when input value changes */
  onChange: (value: string) => void;
  /** Called when a category is determined from selection */
  onCategoryChange?: (category: string) => void;
  /** Called when user presses Enter with valid input (dropdown closed) */
  onSubmit?: () => void;
  /** Input placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional className for the input */
  className?: string;
  /** Maximum height for the dropdown (default: 150px) */
  maxDropdownHeight?: number;
}

/**
 * SmartIngredientInput - Input with ingredient autocomplete functionality
 *
 * Features:
 * - Fetches available ingredients on mount
 * - Shows dropdown with matching ingredients as user types
 * - Auto-fills category when an existing ingredient is selected
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - "Add new" option when no exact match exists
 */
export function SmartIngredientInput({
  value,
  onChange,
  onCategoryChange,
  onSubmit,
  placeholder = "Add item...",
  disabled = false,
  className,
  maxDropdownHeight = 150,
}: SmartIngredientInputProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [availableIngredients, setAvailableIngredients] = useState<AutocompleteIngredient[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch available ingredients when auth is ready
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchIngredients = async () => {
      try {
        const token = await getToken();
        const ingredients = await ingredientApi.list(undefined, token);
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
  }, [isLoaded, isSignedIn, getToken]);

  const handleIngredientSelect = (ingredient: AutocompleteIngredient) => {
    onChange(ingredient.name);
    // Auto-fill category from the selected ingredient
    if (ingredient.category && onCategoryChange) {
      onCategoryChange(ingredient.category);
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
    value: value,
    onValueChange: onChange,
    onIngredientSelect: handleIngredientSelect,
  });

  // Custom key handler that adds Enter-to-submit when dropdown is closed
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If dropdown is open, let the hook handle navigation
    if (open && items.length > 0) {
      hookKeyDown(e);
      return;
    }
    // If dropdown is closed and Enter is pressed, trigger submit
    if (e.key === "Enter" && value.trim() && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative flex-1 min-w-0">
      <Input
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={() => handleBlur(listRef)}
        placeholder={placeholder}
        className={cn("w-full", className)}
        disabled={disabled}
        autoComplete="off"
      />
      {/* Dropdown */}
      {open && items.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-auto p-1"
          style={{ maxHeight: `${maxDropdownHeight}px` }}
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
                  {value.toLowerCase().trim() === item.data.name.toLowerCase() && (
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
  );
}
