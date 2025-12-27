"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";

// ============================================================================
// Types
// ============================================================================

export interface Ingredient {
  id: number;
  name: string;
  category: string;
}

export interface IngredientAutocompleteProps {
  /** Available ingredients to search/filter */
  ingredients: Ingredient[];
  /** Current input value (controlled) */
  value: string;
  /** Called when input value changes */
  onValueChange: (value: string) => void;
  /** Called when an existing ingredient is selected */
  onIngredientSelect: (ingredient: Ingredient) => void;
  /** Called when user submits a new ingredient name (not in list) */
  onNewIngredient?: (name: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional class names */
  className?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function IngredientAutocomplete({
  ingredients,
  value,
  onValueChange,
  onIngredientSelect,
  onNewIngredient,
  placeholder = "Type ingredient name...",
  className,
  disabled = false,
  autoFocus = false,
}: IngredientAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

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
    const list: Array<{ type: "ingredient"; data: Ingredient } | { type: "create"; name: string }> =
      filteredIngredients.map((ing) => ({ type: "ingredient" as const, data: ing }));

    if (showCreateOption) {
      list.push({ type: "create" as const, name: value.trim() });
    }
    return list;
  }, [filteredIngredients, showCreateOption, value]);

  // Reset highlight when items change
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [items.length]);

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (open && listRef.current) {
      const highlighted = listRef.current.children[highlightedIndex] as HTMLElement;
      highlighted?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, open]);

  // Handle selecting an item
  const handleSelect = (index: number) => {
    const item = items[index];
    if (!item) return;

    if (item.type === "ingredient") {
      onValueChange(item.data.name);
      onIngredientSelect(item.data);
    } else if (item.type === "create" && onNewIngredient) {
      onNewIngredient(item.name);
    }
    setOpen(false);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onValueChange(newValue);
    setOpen(newValue.trim().length > 0);
    setHighlightedIndex(0);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        setOpen(false);
        // Auto-select single match when tabbing away
        if (items.length === 1 && items[0].type === "ingredient") {
          onValueChange(items[0].data.name);
          onIngredientSelect(items[0].data);
        }
        break;
    }
  };

  const handleFocus = () => {
    if (value.trim() && items.length > 0) {
      setOpen(true);
      setHighlightedIndex(0);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay to allow click events on list items
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setOpen(false);
      }
    }, 150);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          className={cn("w-full", className)}
        />
      </PopoverAnchor>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (e.target === inputRef.current) {
            e.preventDefault();
          }
        }}
      >
        <div
          ref={listRef}
          className="max-h-[200px] overflow-y-auto p-1"
          role="listbox"
        >
          {items.length === 0 && (
            <div className="py-3 text-center text-sm text-muted">
              No ingredients found.
            </div>
          )}

          {items.map((item, index) => (
            <div
              key={item.type === "ingredient" ? item.data.id : "create-new"}
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
              {item.type === "ingredient" ? (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{item.data.name}</span>
                    <span className="text-xs text-muted">
                      {item.data.category}
                    </span>
                  </div>
                  {exactMatch?.id === item.data.id && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Create <span className="font-medium text-primary">&quot;{item.name}&quot;</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
