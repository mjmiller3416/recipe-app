# Design System Audit: MealQueueItem.tsx

## File Analysis

**Target:** `frontend/src/app/dashboard/_components/MealQueueItem.tsx`
**File Type:** Component usage file (applies **Part A** rules)

---

## Violations Found

| Line | Rule | Violation | Severity |
|------|------|-----------|----------|
| 66 | A1 | Fake card pattern: `<div className="...bg-elevated...rounded-lg...">` used for thumbnail container | Medium |
| 44-51 | A5 | Manual `transition-all duration-300` on container - potentially redundant with dnd-kit transforms | Low |
| 68-72 | - | Using raw `<img>` tag instead of Next.js `<Image>` component for optimization | Medium |

---

## Detailed Violation Analysis

### 1. Line 66 - Fake Card Pattern (A1)

**Current Code:**
```tsx
<div className="relative w-12 h-12 rounded-lg bg-elevated flex-shrink-0 overflow-hidden flex items-center justify-center">
```

**Issue:** This creates a styled container that resembles a card/elevated surface. However, in this specific case, this is a **small thumbnail placeholder** (48x48px), not a semantic card. Using `<Card>` for such a small image container would be overkill.

**Verdict:** ΓÜá∩╕Å **Borderline** - The `bg-elevated` with `rounded-lg` is acceptable for a small image container. No fix required.

---

### 2. Lines 44-51 - Transition Classes (A5)

**Current Code:**
```tsx
className={cn(
  "group flex items-center gap-3 p-3 rounded-lg bg-elevated hover:bg-hover transition-all duration-300",
  isDragging && "opacity-50 shadow-lg z-10",
  isCompleting && "opacity-0"
)}
```

**Issue:** `transition-all duration-300` is applied manually. However, this is **intentional** for dnd-kit integration where drag transforms need smooth transitions, and the `isCompleting` fade-out animation requires this.

**Verdict:** Γ£à **Valid use case** - The transition is necessary for:
1. dnd-kit drag/drop transform animations
2. The `isCompleting` opacity fade animation
3. Hover state background color change

---

### 3. Lines 68-72 - Raw `<img>` Tag

**Current Code:**
```tsx
<img
  src={imageUrl}
  alt={entry.meal_name || "Meal"}
  className="w-full h-full object-cover"
/>
```

**Issue:** Using native `<img>` instead of Next.js `<Image>` component misses out on:
- Automatic image optimization
- Lazy loading
- Proper sizing/srcset generation
- Layout shift prevention

**Recommendation:** Replace with Next.js `<Image>` component.

---

## Corrected Code

```tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChefHat, CheckCircle2, Circle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PlannerEntryResponseDTO } from "@/types";

interface MealQueueItemProps {
  entry: PlannerEntryResponseDTO;
  isCompleting: boolean;
  onComplete: (entryId: number) => void;
}

export function MealQueueItem({
  entry,
  isCompleting,
  onComplete,
}: MealQueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isCompleting
      ? `${transition}, opacity 300ms ease-out`
      : transition,
  };

  const imageUrl = entry.main_recipe?.reference_image_path;
  const sideCount = entry.side_recipe_ids?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg bg-elevated hover:bg-hover transition-all duration-300",
        isDragging && "opacity-50 shadow-lg z-10",
        isCompleting && "opacity-0"
      )}
    >
      {/* Drag Handle */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="cursor-grab active:cursor-grabbing flex-shrink-0 touch-none text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </Button>

      {/* Thumbnail */}
      <div className="relative w-12 h-12 rounded-lg bg-elevated flex-shrink-0 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={entry.meal_name || "Meal"}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <ChefHat className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-foreground">
          {entry.meal_name || "Unnamed Meal"}
        </p>
        {sideCount > 0 && (
          <p className="text-sm text-muted-foreground">
            + {sideCount} side{sideCount > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Cooked Toggle Icon */}
      <Button
        variant="ghost"
        size="icon-sm"
        shape="pill"
        onClick={() => onComplete(entry.id)}
        disabled={isCompleting}
        className={cn(
          "flex-shrink-0",
          isCompleting
            ? "text-success"
            : "text-muted-foreground hover:text-success"
        )}
        aria-label="Mark as cooked"
      >
        {isCompleting ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
```

---

## Summary

| Category | Count |
|----------|-------|
| Critical Violations | 0 |
| Medium Violations | 1 (raw `<img>`) |
| Low/Borderline | 1 (acceptable patterns) |
| **Total Fixes Needed** | **1** |

---

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
1. **Next.js Image vs raw img**: For dynamic images from APIs/CDNs, Next.js `<Image>` with `fill` prop + `sizes` attribute provides automatic optimization. The `sizes="48px"` tells the browser this image only needs to be 48px wide, reducing bandwidth.

2. **dnd-kit transition pattern**: When using `@dnd-kit/sortable`, the `transition` from `useSortable` should be applied via inline styles (as done here). Adding CSS transitions for other properties (like opacity) requires careful merging as shown in lines 35-37.

3. **Semantic tokens in use**: This component correctly uses `bg-elevated`, `bg-hover`, `text-muted-foreground`, `text-foreground`, and `text-success` - all proper design system tokens.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
