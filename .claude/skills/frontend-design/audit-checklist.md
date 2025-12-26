# Page Audit Checklist

Use this checklist when reviewing or revising an existing page for design consistency.

---

## Quick Audit Checklist

### 1. Surface Colors
Are all backgrounds using the correct token?
- Page background → `bg-background`
- Cards/panels → `bg-card` or `bg-elevated`
- Inputs → `bg-input`
- Popovers/dropdowns → `bg-popover`
- Sidebar → `bg-sidebar`

### 2. Typography
Is text using the hierarchy?
- Primary text → `text-foreground`
- Secondary text → `text-muted`
- Subtle text → `text-foreground-subtle`
- Disabled → `text-foreground-disabled`

### 3. Spacing
Are margins/padding from the standard scale?
- Look for arbitrary values like `mt-[13px]` → fix to `mt-3`
- Verify consistent `gap-*` usage in flex/grid layouts
- Standard scale: 1, 2, 3, 4, 6, 8, 12 (avoid 1.5, 2.5, etc.)

### 4. Components
Are base UI elements Shadcn/UI?
- Buttons, inputs, cards, dialogs, etc. should come from `/components/ui`
- No custom implementations of standard components
- Check that variants are used correctly (see component-usage.md)

### 5. Borders
Consistent border tokens?
- `border-border` for standard borders
- `border-subtle` for light/subtle borders
- `border-strong` for emphasis

### 6. Hover/Active States
Every interactive element should have feedback:
- Buttons → built-in via Shadcn variants
- Cards → `hover:shadow-lg transition-shadow`
- List items → `hover:bg-accent`
- Links → `hover:text-primary`

---

## Common Inconsistencies to Fix

| Issue | Problem | Fix |
|-------|---------|-----|
| Mixed button styles | Different variants for same action type | Primary actions use `variant="default"`, secondary use `variant="outline"` |
| Inconsistent card padding | `p-3`, `p-4`, `p-5`, `p-6` mixed | Standardize on `p-4` or `p-6` per card type |
| Random icon sizes | Mix of `h-3`, `h-4`, `h-5`, `h-6` | Use `h-4 w-4` (small), `h-5 w-5` (default), `h-6 w-6` (large) |
| Mismatched border radius | Different radius on similar elements | Cards use `rounded-xl`, buttons use `rounded-md`, badges use `rounded-full` |
| Hardcoded colors | `text-gray-500`, `bg-purple-600` | Always use tokens: `text-muted`, `bg-primary` |
| Arbitrary spacing | `mt-[13px]`, `gap-2.5` | Use standard scale: `mt-3`, `gap-2` or `gap-3` |

---

## Page-Level Consistency Rules

### Headers
- All pages should have the same page header pattern (if applicable)
- Consistent title sizing: `text-2xl font-bold` or `text-3xl font-bold`
- Consistent spacing below header: `mb-6` or `mb-8`

### Empty States
- Use a Lucide icon + friendly text pattern
- Icon: `h-12 w-12 text-muted`
- Center content: `flex flex-col items-center justify-center`
- Friendly, action-oriented copy

### Loading States
- Use Shadcn Skeleton component
- Match skeleton dimensions to actual content
- See component-usage.md for skeleton patterns

### Error States
- Use destructive styling: `text-destructive`, `border-destructive`
- Consistent error message placement
- Clear recovery action (retry button, etc.)

---

## Audit Workflow

1. **Scan the page** — Look for visual inconsistencies
2. **Check tokens** — Verify colors, spacing, typography use correct variables
3. **Test hover states** — Every clickable element should respond
4. **Test both modes** — Verify dark AND light mode appearance
5. **Check responsiveness** — Test at mobile, tablet, desktop breakpoints
