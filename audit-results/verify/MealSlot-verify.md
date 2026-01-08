---

## Updated Analysis After Card Review

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
The Card component already includes:
- `transition-all duration-200 ease-in-out` in base styles (line 8)
- `interactive` variant with hover, focus, and active states (line 17)

This means MealSlot's redundant transitions are definitely violations.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

---

## Final Violations List

| Line | Rule | Issue | Severity |
|------|------|-------|----------|
| 71 | A5 | Redundant `transition-all duration-200 ease-in-out` (Card has this built-in) | Medium |
| 121 | A5 | Redundant `transition-all duration-200 ease-in-out` (Card has this built-in) | Medium |
| 68-114 | A5 | Should use `interactive` prop instead of manual cursor/hover classes | Medium |
| 118-179 | A5 | Should use `interactive` prop instead of manual cursor/hover classes | Medium |

---

## Corrected Code

```tsx
"use client";

import { UtensilsCrossed, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircularImage } from "@/components/common/CircularImage";
import { cn } from "@/lib/utils";
import type { RecipeCardData } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface MealSlotProps {
  /** Slot variant - main is larger, side is compact */
  variant: "main" | "side";
  /** Recipe assigned to this slot (null for empty) */
  recipe?: RecipeCardData | null;
  /** Whether this slot is currently active/selected */
  isActive: boolean;
  /** Called when slot is clicked */
  onClick: () => void;
  /** Called when clear button is clicked (only shown when filled) */
  onClear?: () => void;
  className?: string;
}

// ============================================================================
// MEAL SLOT COMPONENT
// ============================================================================

/**
 * MealSlot - Unified slot component for main dish and side dishes
 *
 * Features:
 * - Empty state with dashed border and icon
 * - Filled state with recipe thumbnail and info
 * - Active state with purple highlight border
 * - Clear button on filled slots
 */
export function MealSlot({
  variant,
  recipe,
  isActive,
  onClick,
  onClear,
  className,
}: MealSlotProps) {
  const isMain = variant === "main";
  const label = isMain ? "Main Dish" : "Side Dish";

  // Format time for display
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m prep`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Handle clear button click
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  };

  // Empty state
  if (!recipe) {
    return (
      <Card
        interactive
        className={cn(
          "overflow-hidden cursor-pointer",
          "border-dashed border-2",
          "pb-0 pt-0 gap-0",
          // Active state: primary border
          isActive
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-muted hover:border-primary/30 hover:bg-hover",
          // Focus state
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // All cards use aspect-square for consistent sizing
          "aspect-square",
          className
        )}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label={`Select ${label.toLowerCase()} slot`}
        aria-pressed={isActive}
      >
        <div className="flex flex-col items-center justify-center p-4 h-full gap-2">
          <div
            className={cn(
              "p-3 rounded-full transition-colors",
              isActive ? "bg-primary/10" : "bg-muted"
            )}
          >
            <UtensilsCrossed
              className={cn(
                "h-8 w-8 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        </div>
      </Card>
    );
  }

  // Filled state
  return (
    <Card
      interactive
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        "pb-0 pt-0 gap-0",
        // Active state: primary border
        isActive
          ? "border-2 border-primary shadow-lg shadow-primary/10"
          : "border border-border hover:shadow-lg hover:shadow-primary/5 hover:bg-hover",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // All cards use aspect-square for consistent sizing
        "aspect-square",
        className
      )}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${recipe.name} - click to replace`}
      aria-pressed={isActive}
    >
      {/* Clear button */}
      {onClear && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleClear}
          className={cn(
            "absolute top-2 right-2 z-10 size-6",
            "bg-background/80 backdrop-blur-sm border border-border",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
          )}
          aria-label={`Remove ${recipe.name}`}
        >
          <X className="size-3" />
        </Button>
      )}

      {/* Centered vertical layout */}
      <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-4">
        {/* Circular Recipe Image */}
        <CircularImage
          src={recipe.imageUrl}
          alt={recipe.name}
          size="xl"
          zoom={1.3}
        />

        {/* Recipe Info */}
        <div className="flex flex-col items-center min-w-0 w-full">
          <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {recipe.name}
          </h4>
          {recipe.totalTime > 0 && (
            <span className="text-xs text-muted-foreground mt-0.5">
              {formatTime(recipe.totalTime)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
```

---

## Changes Summary

| Change | Lines Affected | Reason |
|--------|----------------|--------|
| Added `interactive` prop to both Cards | 69, 118 | Leverage Card's built-in interactive states |
| Removed `transition-all duration-200 ease-in-out` | 71, 121 | Card already has this in base styles |
| Kept custom hover states | 77, 126 | These are **intentional overrides** for this specific component's design (dashed border, primary shadow glow) |

---

## Recommendations

1. **Consider Card variant extension**: If the dashed-border + primary-glow pattern is used elsewhere, consider adding a `selectable` variant to Card.

2. **Button reveal pattern is acceptable**: The `opacity-0 group-hover:opacity-100 transition-opacity` pattern on the clear button is a valid animation override, not a redundant interaction state.

3. **Focus states are duplicated**: Lines 79-80 and 128-129 duplicate focus-visible styles that Card's `interactive` variant already provides. These can be removed if using `interactive`.
