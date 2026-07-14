# Component Audit Criteria

> Frontend component audit checklist. Applied with `general.md`.

## Reference Standards

- `@.claude/context/frontend/frontend-core.md` — Critical rules and pre-edit checklist
- `@.claude/context/frontend/design-tokens.md` — Semantic color tokens, spacing scale, sizing, shadows
- `@.claude/context/frontend/shadcn-patterns.md` — Card, Button, Badge, Dialog usage patterns
- `@.claude/context/frontend/component-patterns.md` — Icon buttons, empty states, loading states, conditional classes
- `@.claude/context/frontend/accessibility.md` — ARIA labels, form labeling, keyboard nav, semantic HTML
- `@.claude/context/frontend/component-inventory.md` — Available components (check before creating new ones)

---

## Checklist

### Design System Compliance

| # | Check | Severity | Grep Pattern |
|---|-------|----------|-------------|
| C.1 | Semantic color tokens only — no hardcoded color classes | Error | `(text\|bg\|border)-(gray\|slate\|zinc\|red\|green\|blue\|yellow\|orange\|purple\|pink\|neutral\|stone)-\d` |
| C.2 | Tailwind scale values only — no arbitrary pixel values | Error | `-\[\d+px\]` |
| C.3 | Use shadcn `<Card>` — not raw `<div>` styled as a card | Warning | _(visual: div with bg-card + border + rounded acting as card)_ |
| C.4 | Use shadcn `<Button>` — not raw `<button>` elements | Error | `<button ` (without being inside a shadcn component) |
| C.5 | Card horizontal layout uses explicit `flex-row` — Card applies `flex-col` by default | Warning | _(visual: Card children unexpectedly stacking vertically)_ |

### Accessibility

| # | Check | Severity | Grep Pattern |
|---|-------|----------|-------------|
| C.6 | Icon-only buttons have `aria-label` | Error | `size="icon"` without `aria-label` on same element |
| C.7 | Form inputs have associated `<Label htmlFor=...>` | Warning | _(visual: Input/Select/Textarea without Label)_ |
| C.8 | Images have meaningful `alt` text (empty string for decorative) | Warning | `<img ` or `<Image ` without `alt` |
| C.9 | Custom interactive elements have `role`, `tabIndex`, `onKeyDown` | Warning | _(visual: onClick on div/span without keyboard support)_ |

### Component Structure

| # | Check | Severity |
|---|-------|----------|
| C.10 | Props defined as TypeScript interface (not inline object type) | Suggestion |
| C.11 | Accepts `className` prop and passes to root element via `cn()` | Suggestion |
| C.12 | Conditional classes use `cn()` utility — not string concatenation or ternary in template literals | Warning |

### Icons & Loading

| # | Check | Severity | Grep Pattern |
|---|-------|----------|-------------|
| C.13 | Icons imported from `lucide-react` only | Error | `from ['"]react-icons` |
| C.14 | Icons use `strokeWidth={1.5}` | Warning | Icon usage without `strokeWidth` prop |
| C.15 | Async action buttons show loading state (Loader2 spinner + disabled) | Warning | _(visual: onClick with async/await but no loading indicator)_ |

### Component Reuse

| # | Check | Severity |
|---|-------|----------|
| C.16 | No recreating components that exist in shadcn/ui — ref `@component-inventory.md` | Warning |
| C.17 | No recreating custom project components (StatCard, PageHeader, etc.) — ref `@component-inventory.md` | Warning |

---

## Common Anti-Patterns

Flag these if found:

| Pattern | Severity | Grep Pattern |
|---------|----------|-------------|
| Inline styles (`style={{...}}`) | Warning | `style=\{\{` |
| Direct DOM manipulation (`document.querySelector`, `document.getElementById`) | Warning | `document\.(querySelector\|getElementById\|getElementsBy)` |
| Missing `"use client"` on interactive components (useState, useEffect, onClick) | Error | _(file uses hooks/handlers but no "use client" directive)_ |
