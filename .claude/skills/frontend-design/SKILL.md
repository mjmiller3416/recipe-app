---
name: Frontend Design
description: |
  🚨 MANDATORY BEFORE ANY FRONTEND EDITS 🚨

  REQUIRED for ANY work involving frontend/ files. MUST invoke BEFORE making changes to:
  - Files matching: frontend/src/**/*.{tsx,ts,css}
  - React components, pages, layouts, hooks
  - UI styling, design tokens, shadcn components
  - Any bug fixes, features, or refactoring in frontend code

  ⚠️ EDITING WITHOUT THIS CONTEXT WILL BREAK DESIGN CONSISTENCY ⚠️

  Trigger phrases: "add component", "fix UI", "create page", "styling", "design", "button", "card", "form", "frontend bug"

  Provides: design system rules, component patterns, semantic tokens, shadcn/ui usage, file organization, accessibility guidelines.
---

# Frontend Design Skill

**⚠️ THIS SKILL MUST BE INVOKED BEFORE ANY FRONTEND CODE CHANGES ⚠️**

Design system rules and patterns for Meal Genie. For token values, see `globals.css`. For component examples, reference existing implementations.

## Critical Rules (Never Violate)

| Rule | Wrong | Right |
|------|-------|-------|
| Fake cards | `<div className="bg-card border rounded-xl">` | `<Card>` |
| Raw buttons | `<button className="px-4 py-2">` | `<Button variant="...">` |
| Raw badges | `<span className="px-2 py-1 rounded-full">` | `<Badge>` |
| Hardcoded colors | `text-gray-500`, `bg-slate-800` | `text-muted-foreground`, `bg-card` |
| Arbitrary values | `h-[38px]`, `gap-[15px]` | `h-10`, `gap-4` |
| Missing aria-label | `<Button size="icon"><X /></Button>` | `<Button size="icon" aria-label="Close">` |
| Wrong icons | `react-icons`, `heroicons` | `lucide-react` with `strokeWidth={1.5}` |

## Imports Pattern

```tsx
// UI components (shadcn/ui)
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Icons (always lucide-react)
import { Plus, X, ChevronRight, Loader2 } from "lucide-react";

// Utilities
import { cn } from "@/lib/utils";
```

## Semantic Tokens

Always use semantic tokens from `globals.css`. Never hardcode Tailwind colors.

**Text:**
- `text-foreground` — primary text
- `text-muted-foreground` — secondary, placeholders
- `text-primary` — accent, links
- `text-destructive` — errors

**Backgrounds:**
- `bg-background` — page
- `bg-card` or `bg-elevated` — cards, panels
- `bg-muted` — subtle surfaces
- `bg-accent` — hover states

**Borders:**
- `border-border` — default
- `border-input` — form inputs
- `border-destructive` — error states

**Recipe-specific:**
- `bg-recipe-category-bg` / `text-recipe-category-text` — category badges
- `bg-recipe-meal-type-bg` / `text-recipe-meal-type-text` — meal type badges
- `bg-recipe-dietary-bg` / `text-recipe-dietary-text` — dietary badges

## Spacing & Sizing

Use Tailwind scale exclusively. No arbitrary pixel values.

**Spacing:**
- `gap-2` (8px) — icon + text, related elements
- `gap-4` (16px) — form fields, card sections
- `gap-6` (24px) — content sections
- `space-y-2` — label to input
- `space-y-4` — between form fields
- `space-y-6` — between sections

**Heights:**
- `h-8` (32px) — small buttons, dense UI
- `h-10` (40px) — default inputs, buttons
- `h-12` (48px) — large buttons, touch targets

**Icons:**
- `size-4` (16px) — inline with text
- `size-5` (20px) — standalone small
- `size-6` (24px) — standalone medium

## Interactive States

Components have built-in states. Don't duplicate hover/focus classes on shadcn components.

For custom interactive elements:
```tsx
// Interactive card
<Card className="interactive cursor-pointer">

// Subtle interaction (smaller elements)  
<Card className="interactive-subtle cursor-pointer">
```

**Loading states:**
```tsx
<Button disabled>
  <Loader2 className="size-4 mr-2 animate-spin" />
  Saving...
</Button>
```

## Component Patterns

### Icon Buttons
```tsx
// Always include aria-label
<Button size="icon" variant="ghost" aria-label="Close">
  <X className="size-4" strokeWidth={1.5} />
</Button>
```

### Form Fields
```tsx
<div className="space-y-2">
  <Label htmlFor="name">
    Recipe Name <span className="text-destructive">*</span>
  </Label>
  <Input id="name" placeholder="Enter recipe name" />
  <p className="text-sm text-muted-foreground">Helper text</p>
</div>
```

### Icon + Text
```tsx
<div className="flex items-center gap-2">
  <Clock className="size-4 text-muted-foreground" strokeWidth={1.5} />
  <span className="text-sm">30 minutes</span>
</div>
```

### Empty States
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <FileX className="size-8 text-muted-foreground" strokeWidth={1.5} />
  </div>
  <h3 className="text-lg font-semibold">No recipes found</h3>
  <p className="text-sm text-muted-foreground mt-1 mb-4">
    Try adjusting your filters
  </p>
  <Button>Add Recipe</Button>
</div>
```

## File Organization

| Type | Location |
|------|----------|
| Pages | `src/app/[page]/page.tsx` |
| Page-specific components | `src/app/[page]/_components/` |
| Shared components | `src/components/common/` |
| Domain components | `src/components/[domain]/` (recipe, meal-planner, etc.) |
| shadcn/ui primitives | `src/components/ui/` (don't modify) |
| Hooks | `src/hooks/` |
| Design tokens | `src/app/globals.css` |

## Reference Files

For patterns, look at existing implementations:

| Pattern | Reference |
|---------|-----------|
| Recipe card | `components/recipe/RecipeCard.tsx` |
| Form layout | `app/recipes/add/page.tsx` |
| Dialog usage | `app/meal-planner/_components/` |
| Filter UI | `components/common/FilterBar.tsx` |
| Loading states | Any component with React Query |

## Quick Audit Checklist

Before completing UI work:

- [ ] Using shadcn components (Card, Button, Badge, Input)?
- [ ] No hardcoded colors (gray-*, slate-*, etc.)?
- [ ] No arbitrary values (h-[px], w-[px])?
- [ ] Icon buttons have aria-label?
- [ ] Form inputs have Label with htmlFor?
- [ ] Loading states show spinner + disabled?
- [ ] Using cn() for conditional classes?
- [ ] Icons from lucide-react with strokeWidth={1.5}?

## Adding shadcn Components

```bash
npx shadcn@latest add button dialog card
```

Components install to `components/ui/`. Don't modify these — extend with wrapper components if needed.