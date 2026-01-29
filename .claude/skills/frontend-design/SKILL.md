---
name: Frontend Design
description: Apply Meal Genie design system patterns when creating or modifying React UI components, pages, or styling
---

# Frontend Design Skill

## Purpose

This skill provides comprehensive guidance for creating and modifying UI components in the Meal Genie application following the established design system. It ensures visual consistency, accessibility, and maintainability across all frontend code.

## When to Use

- Creating new UI components or pages
- Modifying existing components
- Reviewing code for design system compliance
- Choosing between shadcn/ui components vs custom implementations

## Quick Reference

### Critical Rules (Never Violate)

| Rule | Bad | Good |
|------|-----|------|
| No fake cards | `<div className="bg-card border rounded-xl">` | `<Card>` |
| No raw buttons | `<button className="p-1.5">` | `<Button variant="ghost" size="icon">` |
| No raw badges | `<span className="bg-primary/20">` | `<Badge variant="secondary">` |
| No hardcoded colors | `text-gray-500` | `text-muted-foreground` |
| No arbitrary values | `h-[38px]` | `h-10` |
| Icon buttons need label | `<Button size="icon"><X /></Button>` | `<Button size="icon" aria-label="Close"><X /></Button>` |

### Component Import Pattern

```tsx
// UI Components (from shadcn/ui)
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Icons (always use lucide-react)
import { Plus, X, ChevronRight } from "lucide-react";

// Utilities
import { cn } from "@/lib/utils";
```

### Sizing Scale

| Size | Height | Use Case |
|------|--------|----------|
| `sm` | `h-8` (32px) | Dense tables, compact toolbars |
| default | `h-10` (40px) | Standard forms, primary actions |
| `lg` | `h-12` (48px) | Hero CTAs, mobile touch targets |

### Spacing Scale

| Token | Pixels | Use Case |
|-------|--------|----------|
| `gap-1` | 4px | Icon + text inline |
| `gap-2` | 8px | Related elements |
| `gap-3` | 12px | List items |
| `gap-4` | 16px | Form fields, card sections |
| `gap-6` | 24px | Content sections |
| `gap-8` | 32px | Major page sections |

### Surface Hierarchy

```tsx
// Level 0: Page background
className="bg-background"

// Level 1: Raised cards
className="surface-raised rounded-xl"

// Level 2: Elevated elements (modals, dropdowns)
className="surface-elevated rounded-xl"

// Level 3: Floating elements (popovers)
className="surface-floating rounded-xl"
```

### Interactive States

For clickable cards and containers, use these utility classes:

```tsx
// Standard interactive card
className="interactive rounded-xl"

// Subtle interaction (small elements)
className="interactive-subtle rounded-md"

// Pressable only (no lift)
className="pressable"

// Liftable only (no press)
className="liftable"
```

## Workflow

### 1. Check shadcn Registry First

Before building anything custom:

```bash
# Search for components
npx shadcn@latest add <component>
```

Or use the MCP tool:
```
mcp__shadcn__search_items_in_registries
mcp__shadcn__get_item_examples_from_registries
```

### 2. Apply Design Tokens

Never hardcode values. Use semantic tokens:

**Colors:**
- Text: `text-foreground`, `text-muted-foreground`, `text-primary`
- Backgrounds: `bg-background`, `bg-card`, `bg-muted`, `bg-primary`
- Borders: `border-border`, `border-input`, `border-destructive`

**Sizes:**
- Use Tailwind scale: `h-10`, `w-64`, `p-4`
- Use component size props: `size="sm"`, `size="lg"`

### 3. Ensure Accessibility

- All icon buttons need `aria-label`
- All form inputs need associated `<Label>`
- Focus states use `focus-visible:` (not `focus:`)
- Loading states show spinner + disabled state

### 4. Self-Audit Checklist

Before completing any component:
- [ ] Using shadcn/ui components where available?
- [ ] No hardcoded colors or arbitrary values?
- [ ] Icon buttons have aria-label?
- [ ] Loading/error states implemented?
- [ ] Works in both light and dark mode?
- [ ] Consistent spacing throughout?

## Related Files

- [tokens.md](tokens.md) - Complete CSS variable reference
- [component-usage.md](component-usage.md) - Component patterns and examples
- [audit-checklist.md](audit-checklist.md) - Full compliance checklist
- [../../design-system-rules.md](../../design-system-rules.md) - Single source of truth

## MCP Tools

- `mcp__shadcn__search_items_in_registries` - Search for components
- `mcp__shadcn__get_item_examples_from_registries` - Get usage examples
- `mcp__shadcn__get_add_command_for_items` - Get install command
