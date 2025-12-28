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
- Cards → `hover:shadow-lg transition-shadow` or use `interactive` utility
- List items → `hover:bg-accent` or use `interactive-subtle` utility
- Links → `hover:text-primary`

### 7. Interactive Utilities (Weight System)
Are clickable elements using appropriate weight utilities?
- Clickable cards → `interactive`, `liftable`, or `interactive-subtle`
- Emphasis buttons → `button-weighted` or `button-bouncy`
- Scrollable areas → `scrollbar-hidden` or `scrollbar-overlay` where appropriate
- Surface depth → `surface-raised`, `surface-elevated`, or `surface-floating`

**Note:** Don't apply interactive utilities to static, non-clickable elements.

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
| Missing tactile feedback | Clickable cards/buttons feel static | Add `interactive`, `interactive-subtle`, or `button-weighted` utilities |
| Inconsistent depth | Cards at same level have different shadows | Use surface classes: `surface-raised`, `surface-elevated` |

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

## Component Tracing (Critical)

When auditing a page, you MUST also audit all custom components used within that page.

### Why This Matters
A page may look correct at first glance, but inconsistencies often hide inside nested components. If a page uses `<RecipeCard />`, `<FilterPanel />`, or any custom component, those components must also pass the audit checklist.

### How to Trace Components

1. **Identify all custom components** used in the page file
   - Look for imports from `@/components/` or `/_components/`
   - Note any components that aren't from `@/components/ui` (Shadcn)

2. **Open each custom component** and apply the full Quick Audit Checklist to it:
   - Surface colors
   - Typography hierarchy
   - Spacing (no arbitrary values)
   - Shadcn usage for base UI
   - Border tokens
   - Hover/active states
   - Interactive utilities

3. **Recurse into nested components** — If a component uses other custom components, audit those too

### Example
```
Auditing: /recipes/page.tsx
  └─ Uses: <RecipeCard /> → Audit this component
      └─ Uses: <RecipeBadge /> → Audit this component too
  └─ Uses: <FilterPanel /> → Audit this component
  └─ Uses: <Button /> → Shadcn, skip (already compliant)
```

### Audit Scope Checklist
Before marking a page audit complete, confirm:
- [ ] Page file itself passes all checks
- [ ] All custom components in the page pass all checks
- [ ] All nested custom components pass all checks
- [ ] No component is skipped (unless it's from `/components/ui`)

---

## Audit Workflow

1. **Identify scope** — List the page + all custom components it uses (recursively)
2. **Scan the page** — Look for visual inconsistencies
3. **Check tokens** — Verify colors, spacing, typography use correct variables
4. **Audit each component** — Apply Quick Audit Checklist to every custom component
5. **Test hover states** — Every clickable element should respond
6. **Test both modes** — Verify dark AND light mode appearance
7. **Check responsiveness** — Test at mobile, tablet, desktop breakpoints
