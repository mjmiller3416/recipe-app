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
import {
  useIngredientAutocomplete,
  type AutocompleteIngredient,
} from "@/hooks/useIngredientAutocomplete";

// ============================================================================
// Types
// ============================================================================

// Re-export the type for backwards compatibility
export type { AutocompleteIngredient as Ingredient } from "@/hooks/useIngredientAutocomplete";

export interface IngredientAutocompleteProps {
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
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const {
    open,
    setOpen,
    highlightedIndex,
    setHighlightedIndex,
    exactMatch,
    items,
    handleSelect,
    handleInputChange,
    handleKeyDown,
    handleFocus,
    handleBlur,
  } = useIngredientAutocomplete({
    ingredients,
    value,
    onValueChange,
    onIngredientSelect,
    onNewIngredient,
  });

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (open && listRef.current) {
      const highlighted = listRef.current.children[highlightedIndex] as HTMLElement;
      highlighted?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, open]);

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
          onBlur={() => handleBlur(listRef)}
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
            <div className="py-3 text-center text-sm text-muted-foreground">
              No ingredients found.
            </div>
          )}

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
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{item.data.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.data.category}
                    </span>
                  </div>
                  {exactMatch?.id === item.data.id && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </>
              ) : item.type === "create" && item.name ? (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Create <span className="font-medium text-primary">&quot;{item.name}&quot;</span>
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
