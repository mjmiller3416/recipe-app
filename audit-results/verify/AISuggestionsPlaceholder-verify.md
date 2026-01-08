# Design System Audit Report: AISuggestionsPlaceholder.tsx

## File Analysis

**Target:** `frontend/src/app/meal-planner/_components/meal-display/AISuggestionsPlaceholder.tsx`
**Location:** `app/` directory ΓåÆ **Part A rules apply** (component usage)

---

## Violations Found

| Line | Rule | Violation | Current | Should Be |
|------|------|-----------|---------|-----------|
| 27 | A6 | Hardcoded opacity value | `bg-primary/10` | `bg-primary-surface` |
| 27 | A6 | Hardcoded opacity value | `border-primary/20` | `border-primary-muted` |
| 38 | A6 | Hardcoded opacity value | `text-primary/70` | `text-primary-on-surface` |

---

## Detailed Analysis

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
1. **Opacity modifiers (`/10`, `/20`, `/70`) are anti-patterns** - The design system provides semantic surface tokens (`--primary-surface`, `--primary-muted`, `--primary-on-surface`) specifically for these "tinted background with matching text" scenarios.
2. **Semantic tokens ensure theme consistency** - In light mode, `bg-primary/10` might look washed out, but `bg-primary-surface` is calibrated for proper contrast in both themes.
3. **The component structure is otherwise excellent** - Using `<Card>` instead of a raw div with card-like styling is exactly right per Rule A1.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

---

## Current Code (with violations highlighted)

```tsx
// Lines 25-41
<Card
  className={cn(
    "p-4 bg-primary/10 border-primary/20",  // Γ¥î A6: Hardcoded opacity values
    className
  )}
>
  {/* Header */}
  <div className="flex items-center gap-2 mb-3">
    <Sparkles className="h-4 w-4 text-primary" />
    <h4 className="text-sm font-medium text-primary">AI Suggestions</h4>
  </div>

  {/* Coming Soon Message */}
  <p className="text-sm text-primary/70 leading-relaxed">  {/* Γ¥î A6: Hardcoded opacity */}
    Coming soon! AI-powered suggestions to enhance your meals with perfect pairings and cooking tips.
  </p>
</Card>
```

---

## Corrected Code

```tsx
"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// ============================================================================
// TYPES
// ============================================================================

interface AISuggestionsPlaceholderProps {
  className?: string;
}

// ============================================================================
// AI SUGGESTIONS PLACEHOLDER COMPONENT
// ============================================================================

/**
 * Placeholder component for the upcoming AI Suggestions feature.
 * Displays a "Coming Soon" message in a purple-tinted card.
 */
export function AISuggestionsPlaceholder({ className }: AISuggestionsPlaceholderProps) {
  return (
    <Card
      className={cn(
        "p-4 bg-primary-surface border-primary-muted",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium text-primary">AI Suggestions</h4>
      </div>

      {/* Coming Soon Message */}
      <p className="text-sm text-primary-on-surface leading-relaxed">
        Coming soon! AI-powered suggestions to enhance your meals with perfect pairings and cooking tips.
      </p>
    </Card>
  );
}
```

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Violations** | 3 |
| **Rule A6 (Token Standardization)** | 3 |
| **Severity** | Low - Visual/maintainability issue |

### What Changes

1. `bg-primary/10` ΓåÆ `bg-primary-surface` - Uses the semantic purple-tinted background token
2. `border-primary/20` ΓåÆ `border-primary-muted` - Uses the semantic purple border token
3. `text-primary/70` ΓåÆ `text-primary-on-surface` - Uses the text color designed for primary surfaces (provides proper contrast in both light/dark modes)

---

**Run `/ds-fix` to apply these corrections automatically.**
