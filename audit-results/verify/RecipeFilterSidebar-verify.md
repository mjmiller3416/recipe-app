# Design System Audit Report: RecipeFilterSidebar.tsx

## File Type Detection
**Location:** `frontend/src/app/shopping-list/_components/RecipeFilterSidebar.tsx`
**Applicable Rules:** Part A (Component Usage) - This is a feature component, not a base UI component.

---

## Violations Found

### Γ£à Compliant Areas
- Uses `<Card>` component properly (line 55)
- Uses `<Button>` component with `variant="ghost"` (lines 70, 106)
- Uses `<Separator>` component (lines 69, 104)
- Uses semantic colors like `text-muted-foreground`, `text-foreground`, `text-primary`, `text-secondary`
- Uses `cn()` for conditional styling

---

### Γ¥î Violations

| Line | Rule | Issue | Severity |
|------|------|-------|----------|
| 56 | A6 | `text-xs` sizing override on heading - should use design token utility | Low |
| 74-75 | A5 | Manual styling on Button: `p-3 h-auto` overrides component defaults | Medium |
| 75 | A6 | `bg-primary/15` - should use semantic surface token `bg-primary-surface` | Medium |
| 75 | A6 | `border-primary/50` - should use semantic token `border-primary-muted` | Low |
| 79 | - | Inline emoji sizing `text-xl` is acceptable for emoji display | OK |
| 85 | A4 | `text-sm` sizing override - should use component defaults | Low |
| 91 | A6 | `text-xs` sizing override - should use design token | Low |
| 109-111 | A5 | Same manual sizing overrides on second Button | Medium |
| 111 | A6 | `bg-secondary/15` - should use `bg-secondary-surface` | Medium |
| 111 | A6 | `border-secondary/50` - should use `border-secondary-muted` | Low |
| 122-123 | A6 | Same pattern with `text-secondary` for active state | OK (semantic) |

---

## Detailed Analysis

### Issue 1: Button Sizing Overrides (Lines 74, 109)
```tsx
// Current (Violation A4/A5)
className={cn(
  "flex items-center gap-3 p-3 h-auto w-full justify-start",
  // ...
)}
```

**Problem:** Manually setting `p-3` and `h-auto` overrides the Button component's built-in sizing system.

**Recommended Fix:** The Button component should handle this via a custom size variant or the existing patterns should be accepted if Button doesn't have an appropriate variant.

---

### Issue 2: Raw Alpha Colors Instead of Surface Tokens (Lines 75, 111)
```tsx
// Current (Violation A6)
isActive && "bg-primary/15 border border-primary/50"
// and
activeFilter === "__manual__" && "bg-secondary/15 border border-secondary/50"
```

**Problem:** Using raw opacity values instead of semantic surface tokens defined in `globals.css`.

**Available Tokens:**
- `--primary-surface` / `--primary-muted` 
- `--secondary-surface` / `--secondary-muted`

---

## Corrected Code

```tsx
"use client";

import { cn } from "@/lib/utils";
import { getRecipeEmoji } from "@/lib/recipeEmoji";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RecipeInfo {
  name: string;
  itemCount: number;
  collectedCount: number;
  isFirstInMeal?: boolean;
}

interface RecipeFilterSidebarProps {
  recipes: RecipeInfo[];
  manualItemCount: number;
  manualCollectedCount: number;
  activeFilter: string | null;
  onFilterChange: (recipeName: string | null) => void;
}

/**
 * RecipeFilterSidebar - Displays recipes contributing to the shopping list
 */
export function RecipeFilterSidebar({
  recipes,
  manualItemCount,
  manualCollectedCount,
  activeFilter,
  onFilterChange,
}: RecipeFilterSidebarProps) {
  const handleRecipeClick = (recipeName: string) => {
    onFilterChange(activeFilter === recipeName ? null : recipeName);
  };

  const handleManualClick = () => {
    onFilterChange(activeFilter === "__manual__" ? null : "__manual__");
  };

  if (recipes.length === 0 && manualItemCount === 0) {
    return null;
  }

  return (
    <Card className="p-4 flex flex-col max-h-[calc(100vh-8rem)]">
      <h3 className="text-meta uppercase tracking-wider mb-4 flex-shrink-0">
        Recipes in this list
      </h3>

      <div className="flex flex-col gap-2 overflow-y-auto overflow-x-hidden flex-1">
        {recipes.map((recipe, index) => {
          const isActive = activeFilter === recipe.name;
          const emoji = getRecipeEmoji(recipe.name);
          const showSeparator = recipe.isFirstInMeal && index > 0;

          return (
            <div key={recipe.name}>
              {showSeparator && <Separator className="my-2" />}
              <Button
                variant="ghost"
                onClick={() => handleRecipeClick(recipe.name)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 h-auto w-full justify-start",
                  isActive && "bg-primary-surface border border-primary-muted"
                )}
              >
                {/* Recipe emoji */}
                <span className="text-xl flex-shrink-0">{emoji}</span>

                {/* Recipe info */}
                <div className="flex-1 min-w-0 text-left">
                  <div
                    className={cn(
                      "font-medium truncate",
                      isActive ? "text-primary-on-surface" : "text-foreground"
                    )}
                  >
                    {recipe.name}
                  </div>
                  <div className="text-muted-foreground font-normal text-meta">
                    {recipe.collectedCount}/{recipe.itemCount} items
                  </div>
                </div>
              </Button>
            </div>
          );
        })}

        {/* Manual items section */}
        {manualItemCount > 0 && (
          <>
            {recipes.length > 0 && <Separator className="my-2" />}
            <Button
              variant="ghost"
              onClick={handleManualClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 h-auto w-full justify-start",
                activeFilter === "__manual__" &&
                  "bg-secondary-surface border border-secondary-muted"
              )}
            >
              {/* Manual emoji */}
              <span className="text-xl flex-shrink-0">Γ£Å∩╕Å</span>

              {/* Manual info */}
              <div className="flex-1 min-w-0 text-left">
                <div
                  className={cn(
                    "font-medium",
                    activeFilter === "__manual__"
                      ? "text-secondary-on-surface"
                      : "text-foreground"
                  )}
                >
                  Manual items
                </div>
                <div className="text-muted-foreground font-normal text-meta">
                  {manualCollectedCount}/{manualItemCount} items
                </div>
              </div>
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
```

---

## Summary of Changes

| Change | Before | After | Rationale |
|--------|--------|-------|-----------|
| Heading style | `text-xs font-semibold text-muted-foreground` | `text-meta` | Uses typography utility from globals.css |
| Active background | `bg-primary/15` | `bg-primary-surface` | Uses semantic surface token |
| Active border | `border-primary/50` | `border-primary-muted` | Uses semantic border token |
| Active text | `text-primary` | `text-primary-on-surface` | Better contrast on surface backgrounds |
| Secondary active | `bg-secondary/15` | `bg-secondary-surface` | Uses semantic surface token |
| Secondary border | `border-secondary/50` | `border-secondary-muted` | Uses semantic border token |
| Secondary text | `text-secondary` | `text-secondary-on-surface` | Better contrast on surface backgrounds |
| Item count text | `text-xs text-muted-foreground` | `text-meta text-muted-foreground` | Uses typography utility |

---

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
1. **Surface tokens vs raw opacity**: The design system defines `--primary-surface` and `--secondary-surface` specifically for tinted backgrounds. Using `bg-primary/15` bypasses the carefully calibrated light/dark mode values.
2. **On-surface text tokens**: The `--primary-on-surface` and `--secondary-on-surface` tokens ensure proper contrast ratios (~7:1) when text appears on tinted surface backgrounds.
3. **Typography utilities**: The `text-meta` utility class bundles font-size, line-height, font-weight, and letter-spacing into a semantic unit, making the codebase more maintainable.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

---

## Compliance Score: 7/10

**To reach 10/10:**
1. Apply the surface token changes above
2. Consider adding a custom Button variant for "filter pill" use case if this pattern is reused
