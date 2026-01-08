# Design System Audit Report: MealGridCard.tsx

## File Classification
**Location:** `app/meal-planner/_components/MealGridCard.tsx`
**Applicable Rules:** **Part A** (Component Usage Rules)

---

## Violations Found

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
This component is generally well-structured and already uses the `Card` and `Button` base components correctly. The main issues are minor token standardization problems and some inconsistent sizing patterns.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

### Violation 1: Raw Size Class on Icon Button (A4)
**Line 94:** `size="icon-sm"` with additional `className="relative size-6 rounded-full"`
- **Issue:** Manual sizing override (`size-6`) on a Button that already has a size prop
- **Rule A4:** No manual sizing overrides on components - use built-in `size` prop

### Violation 2: Inconsistent Icon Sizing (A4)
**Lines 104, 119, 136, 142:** Mix of `size-3.5` and `h-3.5 w-3.5` for icons
- **Issue:** Inconsistent icon size notation (`size-3.5` vs `h-3.5 w-3.5`)
- **Rule B4:** Icons should use consistent `size-4` (16px) by default

### Violation 3: Arbitrary Height Value (A6)
**Line 79:** `h-28` (112px) for image container
- **Note:** This is acceptable as it's a layout dimension, not a component override. `h-28` is standard Tailwind.

### Violation 4: Manual Color Token on Secondary Text (Minor)
**Line 105:** `text-secondary` used for shopping cart icon
- **Note:** This is actually using the semantic token correctly. Γ£à

### Violation 5: Redundant Transition on Image (A5)
**Line 84:** `transition-transform duration-300 group-hover:scale-105`
- **Issue:** Manual transition on an element inside a Card that uses `liftable` (line 70)
- **Note:** This is intentional - the image zooms while the card lifts. This is acceptable for a distinct visual effect.

---

## Summary

| Category | Count |
|----------|-------|
| Critical Violations | 0 |
| Minor Violations | 2 |
| Acceptable Patterns | 3 |

---

## Corrected Code

```tsx
"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { ShoppingCart, Users, Clock, Heart } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface MealGridItem {
  id: number;
  name: string;
  imageUrl: string | null;
  servings?: number | null;
  totalTime?: number | null;
  isFavorite?: boolean;
  excludeFromShopping?: boolean;
}

interface MealGridCardProps {
  item: MealGridItem;
  isSelected?: boolean;
  onClick?: () => void;
  onToggleExcludeFromShopping?: () => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ============================================================================
// MEAL GRID CARD COMPONENT
// ============================================================================

/**
 * Individual meal card for the grid display.
 * Shows recipe image, name, servings, time, and status indicators.
 */
export function MealGridCard({
  item,
  isSelected = false,
  onClick,
  onToggleExcludeFromShopping,
  className,
}: MealGridCardProps) {
  return (
    <Card
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${item.name} - click to view`}
      className={cn(
        // Base styles
        "group cursor-pointer overflow-hidden",
        "pb-0 pt-0 gap-0",
        // Liftable hover effect
        "liftable hover:bg-hover",
        // Focus styles
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Selected state
        isSelected && "ring-2 ring-primary",
        className
      )}
    >
      {/* Image Section */}
      <div className="relative w-full h-28 overflow-hidden bg-elevated">
        <RecipeImage
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          iconSize="md"
          showLoadingState={false}
        />

        {/* Status Icons - Top Right */}
        <div className="absolute top-2 right-2 flex gap-1">
          {/* Shopping Cart Toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExcludeFromShopping?.();
            }}
            className="rounded-full bg-overlay-strong"
            aria-label={item.excludeFromShopping ? "Include in shopping list" : "Exclude from shopping list"}
          >
            <ShoppingCart
              className={cn(
                "size-4",
                item.excludeFromShopping ? "text-destructive" : "text-secondary"
              )}
              strokeWidth={1.5}
            />
            {item.excludeFromShopping && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-4 h-0.5 bg-destructive rotate-[-45deg]" />
              </span>
            )}
          </Button>

          {/* Favorite Indicator */}
          {item.isFavorite && (
            <div className="size-6 rounded-full bg-overlay-strong flex items-center justify-center">
              <Heart
                className="size-4 text-destructive fill-current"
                strokeWidth={1.5}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {item.servings != null && (
            <span className="flex items-center gap-1">
              <Users className="size-4" strokeWidth={1.5} />
              {item.servings} servings
            </span>
          )}
          {item.totalTime != null && (
            <span className="flex items-center gap-1">
              <Clock className="size-4" strokeWidth={1.5} />
              {formatTime(item.totalTime)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
```

---

## Changes Made

| Line | Before | After | Rule |
|------|--------|-------|------|
| 94 | `size="icon-sm"` + `className="relative size-6 rounded-full bg-overlay-strong"` | `size="icon-sm"` + `className="rounded-full bg-overlay-strong"` | A4 |
| 104 | `size-3.5` | `size-4` | B4 |
| 119 | `size-3.5` | `size-4` | B4 |
| 136 | `h-3.5 w-3.5` | `size-4` | B4 |
| 142 | `h-3.5 w-3.5` | `size-4` | B4 |

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
**Key takeaways:**
1. **Icon consistency matters** - Using `size-4` (16px) uniformly follows the design system standard and makes icons visually consistent
2. **Trust component size props** - The `icon-sm` size variant already handles dimensions; adding manual `size-6` creates conflicts
3. **The `liftable` utility** - This component correctly uses the design system's weight utilities for hover effects rather than manual transitions
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

---

## Recommendation

Run `/ds-fix C:\Users\mjmil\Documents\recipe-app\frontend\src\app\meal-planner\_components\MealGridCard.tsx` to apply these corrections automatically.
