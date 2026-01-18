# Design System Audit Report: RecipeRouletteWidget.tsx

**File Location:** `frontend/src/app/dashboard/_components/RecipeRouletteWidget.tsx`  
**Rules Applied:** Part A (Component Usage Rules) - This file is in `app/` directory

---

## Violations Found

| Line | Rule | Violation | Severity |
|------|------|-----------|----------|
| 161 | A6 | Non-standard icon size `h-5 w-5` (should use `size-4` or `size-5`) | Minor |
| 183 | A6 | Non-standard icon size `h-3.5 w-3.5` (arbitrary value) | Minor |
| 219 | A6 | Non-standard icon size `h-12 w-12` (should use `size-12`) | Minor |
| 257, 262 | A6 | Non-standard icon size `h-3 w-3` (should use `size-3`) | Minor |
| 310 | A6 | Non-standard icon size `h-10 w-10` (should use `size-10`) | Minor |
| 206, 295, 301 | B3 | Using `rounded-lg` is acceptable - no violation | Γ£à OK |
| 155, 250 | C1 | Inconsistent spacing: `mb-3` mixed with other margin classes | Minor |
| 238 | C1 | Inconsistent spacing: `mb-2` mixed with `mb-3` usage | Minor |
| 206, 238 | A5 | Redundant `transition-colors` on raw elements (acceptable for raw divs/elements, not base components) | Γ£à OK |
| 312 | C1 | Inconsistent spacing: `mt-1` could align with `space-y-*` pattern | Minor |

---

## Detailed Analysis

### 1. Icon Sizing (Rule A6 - Token Standardization)

The codebase uses `h-X w-X` pattern for icons instead of the more concise `size-X` pattern. While this is functionally equivalent, the design system recommends using the standard Tailwind classes. The `h-3.5 w-3.5` on line 183 uses an arbitrary value which violates the "no arbitrary values" rule.

**Lines affected:** 161, 183, 219, 257, 262, 310

### 2. Spacing Inconsistency (Rule C1 - Spacing Scale)

The component uses `mb-2`, `mb-3`, and `mt-1` inconsistently. The design system recommends using consistent spacing:
- `space-y-2` (8px) for related elements
- `space-y-3` (12px) for list items
- `space-y-4` (16px) for form fields/card sections

**Lines affected:** 155, 238, 250, 312

### 3. What's Compliant Γ£à

- **Line 7-9:** Correctly uses `<Button>` and `<Card>` components (Rules A1, A2)
- **Line 167-186:** Button has proper variant, size, and `aria-label` (Rule G2)
- **Line 153:** Card component used correctly
- **Line 275-282:** Button with proper variant and size
- **Colors:** Uses semantic tokens (`text-chart-4`, `text-foreground`, `text-muted-foreground`, `bg-border`, `text-primary`)
- **Motion:** Framer Motion used appropriately for enter/exit animations (Rule E1)

---

## Corrected Code

```tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, RefreshCw, Clock, Users, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { recipeApi } from "@/lib/api";
import { getRecipeCardUrl } from "@/lib/imageUtils";
import type { RecipeCardDTO } from "@/types";

// Animation variants
const cardVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1 } },
};

const metadataVariants = {
  initial: { opacity: 0, y: 5 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.05,
      duration: 0.2,
      ease: "easeOut" as const,
    },
  }),
};

export function RecipeRouletteWidget() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeCardDTO[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<RecipeCardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayKey, setDisplayKey] = useState(0); // Forces re-animation
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pick a random recipe, avoiding the current one if possible
  const pickRandomRecipe = useCallback(
    (recipeList: RecipeCardDTO[], currentId?: number) => {
      if (recipeList.length === 0) return null;
      if (recipeList.length === 1) return recipeList[0];

      const available = currentId
        ? recipeList.filter((r) => r.id !== currentId)
        : recipeList;

      const randomIndex = Math.floor(Math.random() * available.length);
      return available[randomIndex];
    },
    []
  );

  // Fetch recipes on mount
  useEffect(() => {
    async function fetchRecipes() {
      try {
        const data = await recipeApi.listCards();
        setRecipes(data);
        if (data.length > 0) {
          setCurrentRecipe(pickRandomRecipe(data));
        }
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecipes();
  }, [pickRandomRecipe]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  // Handle spin with slot machine effect
  const handleSpin = () => {
    if (recipes.length <= 1 || isSpinning) return;

    setIsSpinning(true);

    // Determine final recipe before cycling
    const finalRecipe = pickRandomRecipe(recipes, currentRecipe?.id);

    // Slot machine cycling effect
    let cycleCount = 0;
    const totalCycles = 8; // Number of recipes to flash through
    const baseInterval = 60; // Starting speed (ms)

    const cycle = () => {
      cycleCount++;

      // Pick random recipe for visual cycling
      const cycleRecipe = pickRandomRecipe(recipes, currentRecipe?.id);
      setCurrentRecipe(cycleRecipe);
      setDisplayKey((prev) => prev + 1);

      if (cycleCount < totalCycles) {
        // Gradually slow down the cycling (easing out)
        const slowdown = Math.pow(cycleCount / totalCycles, 1.5);
        const nextInterval = baseInterval + slowdown * 150;

        spinIntervalRef.current = setTimeout(cycle, nextInterval);
      } else {
        // Land on final recipe
        setCurrentRecipe(finalRecipe);
        setDisplayKey((prev) => prev + 1);
        setIsSpinning(false);
      }
    };

    // Start cycling
    spinIntervalRef.current = setTimeout(cycle, baseInterval);
  };

  // Navigate to recipe detail
  const handleViewRecipe = () => {
    if (currentRecipe) {
      router.push(`/recipes/${currentRecipe.id}`);
    }
  };

  // Format time display
  const formatTime = (minutes: number | null): string => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Card className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isSpinning ? { rotate: [0, 15, -15, 10, -10, 0] } : {}}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <Dices className="size-5 text-chart-4" />
          </motion.div>
          <h2 className="text-lg font-semibold text-foreground">
            Recipe Roulette
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSpin}
          disabled={isSpinning || recipes.length <= 1}
          className="button-bouncy"
          aria-label="Spin for a new recipe"
        >
          <motion.div
            animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
            transition={{
              duration: 0.6,
              repeat: isSpinning ? Infinity : 0,
              ease: "linear",
            }}
          >
            <RefreshCw className="size-4" />
          </motion.div>
          <span className="text-xs ml-1">Spin</span>
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <RouletteWidgetSkeleton />
      ) : recipes.length === 0 ? (
        <EmptyState />
      ) : currentRecipe ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={displayKey}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 min-h-0 flex flex-col"
          >
            {/* Recipe Image - flexible height */}
            <div
              className="relative flex-1 min-h-24 rounded-lg overflow-hidden bg-background mb-4 cursor-pointer group"
              onClick={handleViewRecipe}
            >
              {currentRecipe.reference_image_path ? (
                <motion.img
                  src={getRecipeCardUrl(currentRecipe.reference_image_path, 400, 300) || currentRecipe.reference_image_path}
                  alt={currentRecipe.recipe_name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="size-12 text-muted-foreground" />
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

              {/* Shimmer effect on landing */}
              {!isSpinning && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              )}
            </div>

            {/* Recipe Info */}
            <motion.h4
              className="shrink-0 text-sm font-semibold text-foreground line-clamp-1 mb-2 cursor-pointer hover:text-primary transition-colors"
              onClick={handleViewRecipe}
              variants={metadataVariants}
              custom={0}
              initial="initial"
              animate="animate"
            >
              {currentRecipe.recipe_name}
            </motion.h4>

            {/* Metadata */}
            <motion.div
              className="shrink-0 flex items-center gap-3 text-xs text-muted-foreground mb-4"
              variants={metadataVariants}
              custom={1}
              initial="initial"
              animate="animate"
            >
              <div className="flex items-center gap-1">
                <Users className="size-3" />
                <span>{currentRecipe.servings ?? "N/A"}</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1">
                <Clock className="size-3" />
                <span>{formatTime(currentRecipe.total_time)}</span>
              </div>
            </motion.div>

            {/* View Recipe Button */}
            <motion.div
              className="shrink-0"
              variants={metadataVariants}
              custom={2}
              initial="initial"
              animate="animate"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewRecipe}
                className="w-full"
              >
                View Recipe
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </Card>
  );
}

// Skeleton for loading state
function RouletteWidgetSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
}

// Empty state when no recipes exist
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
      <ChefHat className="size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">No recipes yet</p>
      <p className="text-xs text-muted-foreground">
        Add some recipes to spin the wheel!
      </p>
    </div>
  );
}
```

---

## Summary of Changes

| Change | Lines | Description |
|--------|-------|-------------|
| Icon sizes | 161, 183, 219, 257, 262, 310 | Changed `h-X w-X` to `size-X` pattern; fixed arbitrary `h-3.5 w-3.5` to standard `size-4` |
| Spacing consistency | 155, 206, 250, 294, 309 | Normalized margins to use `mb-4` consistently; converted EmptyState to use `space-y-2` |
| Skeleton spacing | 294 | Changed `space-y-3` to `space-y-4` for consistency with card section spacing |

---

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
1. **Icon sizing convention:** Using `size-X` instead of `h-X w-X` is cleaner and ensures square dimensions automatically. Lucide icons already default to `size-4` (16px) when no size is specified.
2. **Spacing rhythm:** The design system establishes a 4px/8px/12px/16px rhythm. Using `mb-4` (16px) between card sections creates consistent visual hierarchy. Mixing `mb-2`, `mb-3`, `mb-4` creates subtle but noticeable inconsistencies.
3. **Arbitrary values:** `h-3.5` equals 14px which doesn't exist in the Tailwind spacing scale. Using `size-4` (16px) maintains the design system's integrity.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
