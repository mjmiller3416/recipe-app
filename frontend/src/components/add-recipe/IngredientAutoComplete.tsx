"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Filter ingredients based on input value (case-insensitive)
  const filteredIngredients = React.useMemo(() => {
    if (!value.trim()) return [];

    const searchTerm = value.toLowerCase().trim();
    return ingredients.filter((ing) =>
      ing.name.toLowerCase().includes(searchTerm)
    );
  }, [ingredients, value]);

  // Check if the current input exactly matches an existing ingredient
  const exactMatch = React.useMemo(() => {
    const searchTerm = value.toLowerCase().trim();
    return ingredients.find((ing) => ing.name.toLowerCase() === searchTerm);
  }, [ingredients, value]);

  // Show "create new" option if there's input text and no exact match
  const showCreateOption = value.trim() && !exactMatch;

  // Total items for keyboard navigation (filtered + optional create)
  const totalItems = filteredIngredients.length + (showCreateOption ? 1 : 0);

  // Reset highlight when filtered results change
  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredIngredients.length, showCreateOption]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onValueChange(newValue);

    // Open dropdown when there's text
    if (newValue.trim()) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  // Handle selecting an existing ingredient
  const handleSelectIngredient = (ingredient: Ingredient) => {
    onValueChange(ingredient.name);
    onIngredientSelect(ingredient);
    setOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle creating a new ingredient
  const handleCreateNew = () => {
    const trimmedValue = value.trim();
    if (trimmedValue && onNewIngredient) {
      onNewIngredient(trimmedValue);
    }
    setOpen(false);
    setHighlightedIndex(-1);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || totalItems === 0) {
      // If dropdown is closed and user presses Enter with a valid value
      if (e.key === "Enter" && value.trim()) {
        e.preventDefault();
        if (exactMatch) {
          handleSelectIngredient(exactMatch);
        } else if (onNewIngredient) {
          handleCreateNew();
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev + 1;
          return next >= totalItems ? prev : next; // Stop at bottom, don't cycle
        });
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? prev : next; // Stop at top, don't cycle
        });
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          // Select highlighted item
          if (highlightedIndex < filteredIngredients.length) {
            handleSelectIngredient(filteredIngredients[highlightedIndex]);
          } else if (showCreateOption) {
            handleCreateNew();
          }
        } else if (filteredIngredients.length === 1) {
          // Auto-select single match
          handleSelectIngredient(filteredIngredients[0]);
        } else if (exactMatch) {
          handleSelectIngredient(exactMatch);
        } else if (showCreateOption && onNewIngredient) {
          handleCreateNew();
        }
        break;

      case "Escape":
        e.preventDefault();
        setOpen(false);
        setHighlightedIndex(-1);
        break;

      case "Tab":
        // Allow natural tab behavior but close dropdown
        setOpen(false);
        setHighlightedIndex(-1);
        // If single match, auto-select before tabbing away
        if (filteredIngredients.length === 1) {
          handleSelectIngredient(filteredIngredients[0]);
        }
        break;
    }
  };

  // Handle focus events
  const handleFocus = () => {
    if (value.trim()) {
      setOpen(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay closing to allow click events on dropdown items
    setTimeout(() => {
      // Only close if focus isn't within the popover
      if (!listRef.current?.contains(document.activeElement)) {
        setOpen(false);
        setHighlightedIndex(-1);
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
          className={cn(
            "w-full",
            className
          )}
        />
      </PopoverAnchor>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()} // Keep focus on input
        onInteractOutside={(e) => {
          // Don't close if clicking the input
          if (e.target === inputRef.current) {
            e.preventDefault();
          }
        }}
      >
        <Command
          ref={listRef}
          shouldFilter={false} // We handle filtering ourselves
          className="max-h-[200px]"
        >
          <CommandList>
            {filteredIngredients.length === 0 && !showCreateOption && (
              <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
                No ingredients found.
              </CommandEmpty>
            )}

            {filteredIngredients.length > 0 && (
              <CommandGroup>
                {filteredIngredients.map((ingredient, index) => (
                  <CommandItem
                    key={ingredient.id}
                    value={ingredient.name}
                    onSelect={() => handleSelectIngredient(ingredient)}
                    className={cn(
                      "flex items-center justify-between cursor-pointer",
                      highlightedIndex === index && "bg-accent"
                    )}
                  >
                    <div className="flex flex-col">
                      <span>{ingredient.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ingredient.category}
                      </span>
                    </div>
                    {exactMatch?.id === ingredient.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showCreateOption && onNewIngredient && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreateNew}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer text-primary",
                    highlightedIndex === filteredIngredients.length && "bg-accent"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    Create &quot;{value.trim()}&quot;
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}