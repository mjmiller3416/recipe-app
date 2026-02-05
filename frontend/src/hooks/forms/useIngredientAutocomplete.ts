"use client";

import * as React from "react";

// ============================================================================
// Types
// ============================================================================

export interface AutocompleteIngredient {
  id: number;
  name: string;
  category: string;
}

export interface AutocompleteItem {
  type: "ingredient" | "create";
  data?: AutocompleteIngredient;
  name?: string;
}

export interface UseIngredientAutocompleteOptions {
  /** Available ingredients to search/filter */
  ingredients: AutocompleteIngredient[];
  /** Current input value (controlled) */
  value: string;
  /** Called when input value changes */
  onValueChange: (value: string) => void;
  /** Called when an existing ingredient is selected */
  onIngredientSelect: (ingredient: AutocompleteIngredient) => void;
  /** Called when user submits a new ingredient name (not in list) */
  onNewIngredient?: (name: string) => void;
}

export interface UseIngredientAutocompleteReturn {
  // State
  open: boolean;
  setOpen: (open: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;

  // Derived data
  filteredIngredients: AutocompleteIngredient[];
  exactMatch: AutocompleteIngredient | undefined;
  items: AutocompleteItem[];

  // Event handlers
  handleSelect: (index: number) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleFocus: () => void;
  handleBlur: (listRef: React.RefObject<HTMLElement | null>) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useIngredientAutocomplete({
  ingredients,
  value,
  onValueChange,
  onIngredientSelect,
  onNewIngredient,
}: UseIngredientAutocompleteOptions): UseIngredientAutocompleteReturn {
  const [open, setOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  // Filter ingredients based on input value (matches start of any word)
  const filteredIngredients = React.useMemo(() => {
    if (!value.trim()) return [];
    const searchTerm = value.toLowerCase().trim();
    return ingredients.filter((ing) => {
      const words = ing.name.toLowerCase().split(/\s+/);
      return words.some((word) => word.startsWith(searchTerm));
    });
  }, [ingredients, value]);

  // Check if the current input exactly matches an existing ingredient
  const exactMatch = React.useMemo(() => {
    const searchTerm = value.toLowerCase().trim();
    return ingredients.find((ing) => ing.name.toLowerCase() === searchTerm);
  }, [ingredients, value]);

  // Show "create new" option if there's input text and no exact match
  const showCreateOption = value.trim() && !exactMatch && onNewIngredient;

  // Build the list of selectable items
  const items = React.useMemo(() => {
    const list: AutocompleteItem[] = filteredIngredients.map((ing) => ({
      type: "ingredient" as const,
      data: ing,
    }));

    if (showCreateOption) {
      list.push({ type: "create" as const, name: value.trim() });
    }
    return list;
  }, [filteredIngredients, showCreateOption, value]);

  // Reset highlight when items change
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [items.length]);

  // Handle selecting an item
  const handleSelect = React.useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;

      if (item.type === "ingredient" && item.data) {
        onValueChange(item.data.name);
        onIngredientSelect(item.data);
      } else if (item.type === "create" && item.name && onNewIngredient) {
        onNewIngredient(item.name);
      }
      setOpen(false);
    },
    [items, onValueChange, onIngredientSelect, onNewIngredient]
  );

  // Handle input change
  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onValueChange(newValue);
      setOpen(newValue.trim().length > 0);
      setHighlightedIndex(0);
    },
    [onValueChange]
  );

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open || items.length === 0) {
        if (e.key === "Enter" && value.trim()) {
          e.preventDefault();
          if (exactMatch) {
            onValueChange(exactMatch.name);
            onIngredientSelect(exactMatch);
          } else if (onNewIngredient) {
            onNewIngredient(value.trim());
          }
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < items.length - 1 ? prev + 1 : prev
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;

        case "Enter":
          e.preventDefault();
          handleSelect(highlightedIndex);
          break;

        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;

        case "Tab":
          // Select highlighted item if menu is open with valid items
          if (items.length > 0 && highlightedIndex >= 0 && highlightedIndex < items.length) {
            const item = items[highlightedIndex];
            if (item.type === "ingredient" && item.data) {
              onValueChange(item.data.name);
              onIngredientSelect(item.data);
            } else if (item.type === "create" && item.name && onNewIngredient) {
              onNewIngredient(item.name);
            }
          }
          setOpen(false);
          // Don't prevent default - allow natural tab navigation
          break;
      }
    },
    [open, items, value, exactMatch, highlightedIndex, handleSelect, onValueChange, onIngredientSelect, onNewIngredient]
  );

  const handleFocus = React.useCallback(() => {
    if (value.trim() && items.length > 0) {
      setOpen(true);
      setHighlightedIndex(0);
    }
  }, [value, items.length]);

  const handleBlur = React.useCallback(
    (listRef: React.RefObject<HTMLElement | null>) => {
      // Delay to allow click events on list items
      setTimeout(() => {
        if (!listRef.current?.contains(document.activeElement)) {
          setOpen(false);
        }
      }, 150);
    },
    []
  );

  return {
    open,
    setOpen,
    highlightedIndex,
    setHighlightedIndex,
    filteredIngredients,
    exactMatch,
    items,
    handleSelect,
    handleInputChange,
    handleKeyDown,
    handleFocus,
    handleBlur,
  };
}
