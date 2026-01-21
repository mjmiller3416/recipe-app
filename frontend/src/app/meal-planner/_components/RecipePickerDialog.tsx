"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeBrowserView } from "@/app/recipes/_components/RecipeBrowserView";
import type { RecipeCardData } from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface RecipePickerDialogProps {
  /** Whether the picker is open */
  open: boolean;
  /** Called when the picker open state changes */
  onOpenChange: (open: boolean) => void;
  /** Called when a recipe is selected */
  onSelect: (recipe: RecipeCardData) => void;
  /** Currently selected recipe IDs - controls which cards show selection state */
  selectedIds?: Set<string | number>;
  /** Filter to only show main dishes or side dishes */
  filterMealType?: "main" | "side" | null;
  /** Title shown in the header */
  title?: string;
  /** Description shown below the title */
  description?: string;
  /** Whether to show a "Done" button for multi-select mode (sides) */
  showDoneButton?: boolean;
  /** Called when the "Done" button is clicked */
  onDone?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * RecipePickerDialog - Inline content for selecting recipes
 *
 * Renders RecipeBrowserView in select mode as inline content (not an overlay).
 * This keeps the app's sidebar visible while browsing recipes.
 */
export function RecipePickerDialog({
  open,
  onOpenChange,
  onSelect,
  selectedIds = new Set(),
  filterMealType = null,
  title = "Select a Recipe",
  description = "Choose a recipe for your meal",
  showDoneButton = false,
  onDone,
}: RecipePickerDialogProps) {
  // Handle escape key to close
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border px-4 md:px-6 py-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="rounded-xl flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-foreground truncate">{title}</h1>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
        {showDoneButton && (
          <Button onClick={onDone} className="flex-shrink-0">
            Done {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
        )}
      </div>

      {/* Recipe Browser in Select Mode */}
      <div className="flex-1">
        <RecipeBrowserView
          mode="select"
          onSelect={onSelect}
          selectedIds={selectedIds}
          filterMealType={filterMealType}
        />
      </div>
    </div>
  );
}
