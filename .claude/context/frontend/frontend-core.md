# Frontend Core

**Critical design system rules - ALWAYS follow these.**

## Never Violate

| Wrong | Right |
|-------|-------|
| `<div className="bg-card border">` | `<Card>` from `@/components/ui/card` |
| `<button>` or raw styling | `<Button variant="...">` |
| `text-gray-500`, `bg-slate-800` | `text-muted-foreground`, `bg-card` |
| `h-[38px]`, `gap-[15px]` | `h-10`, `gap-4` (use Tailwind scale) |
| `<Button size="icon"><X /></Button>` | `<Button size="icon" aria-label="Close">` |
| Icons from `react-icons` | Icons from `lucide-react` with `strokeWidth={1.5}` |

## Required Patterns

```tsx
// Always use shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
```

## Pre-Edit Checklist

- [ ] Using shadcn components, not raw HTML?
- [ ] No hardcoded colors (gray-*, slate-*)?
- [ ] No arbitrary values ([px] units)?
- [ ] Icon buttons have aria-label?
- [ ] Loading states show spinner + disabled?

See design-tokens.md for semantic tokens. See component-patterns.md for templates.
