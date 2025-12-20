---
name: meal-genie-frontend
description: Design guidance for the Meal Genie recipe app frontend. Use when creating/modifying UI components, improving UX, working on theme/color consistency, adding animations, or suggesting design improvements. Provides project-specific patterns, design system values, and component conventions for Next.js 16 / React 19 / Tailwind 4 / shadcn/ui stack.
---

# Meal Genie Frontend Design Skill

Design guidance for creating cohesive, polished UI in the Meal Genie recipe management app.

## Tech Stack Quick Reference

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui (New York style), Radix UI |
| Styling | Tailwind CSS 4, CSS variables (oklch colors) |
| Icons | Lucide React |
| Theming | next-themes (light/dark/system) |
| Toasts | Sonner |

## Design Philosophy

Meal Genie's aesthetic is **warm, approachable, and organized** - like a well-curated recipe box. The UI should feel:
- **Inviting** - Food is personal; the interface should feel welcoming, not clinical
- **Efficient** - Busy cooks need fast navigation and clear hierarchy
- **Delightful** - Subtle animations and polish elevate the experience

### Design Decisions Framework

When making design choices, prioritize:
1. **Consistency** - Match existing patterns before introducing new ones
2. **Hierarchy** - Clear visual weight guides users to primary actions
3. **Feedback** - Every interaction should feel acknowledged
4. **Accessibility** - Radix primitives ensure a11y; preserve it

## Theme System

Uses oklch color space for perceptually uniform colors. All colors defined as CSS variables in `globals.css`.

### Core Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | oklch(1 0 0) | oklch(0.145 0 0) | Page background |
| `--foreground` | oklch(0.145 0 0) | oklch(0.985 0 0) | Primary text |
| `--primary` | oklch(0.205 0 0) | - | Buttons, links |
| `--muted` | oklch(0.97 0 0) | - | Secondary backgrounds |
| `--muted-foreground` | oklch(0.556 0 0) | - | Secondary text |
| `--destructive` | oklch(0.577 0.245 27.325) | - | Delete actions |
| `--sidebar` | oklch(0.985 0 0) | - | Sidebar background |

### Usage in Tailwind

```tsx
// Semantic classes
<div className="bg-background text-foreground" />
<div className="bg-muted text-muted-foreground" />
<div className="border-border" />

// Component variants
<Button variant="default" />   // bg-primary
<Button variant="secondary" /> // bg-secondary
<Button variant="destructive" /> // bg-destructive
<Button variant="ghost" />     // transparent, hover:bg-accent
<Button variant="outline" />   // border, transparent bg
```

## Component Patterns

### Card Sizes (RecipeCard)

| Size | Layout | Use Case |
|------|--------|----------|
| `small` | Horizontal, compact | Sidebar lists, search results |
| `medium` | Vertical, standard grid | Recipe browser default |
| `large` | Side-by-side, full details | Featured recipes, detail previews |

### Button Hierarchy

```
Primary action:    <Button variant="default">Save Recipe</Button>
Secondary action:  <Button variant="outline">Cancel</Button>
Destructive:       <Button variant="destructive">Delete</Button>
Inline/subtle:     <Button variant="ghost" size="icon"><X /></Button>
```

### Spacing System

Follow Tailwind's scale. Common patterns:
- Page padding: `p-6`
- Card padding: `p-4`
- Section gaps: `gap-6` or `space-y-6`
- Tight groups: `gap-2` or `space-y-2`
- Icon-text gap: `gap-2`

## Animation Guidelines

Animations should feel **swift and purposeful**, not slow or bouncy.

### Recommended Timings

| Type | Duration | Easing |
|------|----------|--------|
| Micro-interactions | 150-200ms | ease-out |
| Panel transitions | 200-300ms | ease-in-out |
| Page transitions | 300-400ms | ease-out |
| Hover states | 150ms | ease |

### Common Patterns

```tsx
// Hover lift effect
className="transition-transform hover:-translate-y-1"

// Fade in
className="animate-in fade-in duration-200"

// Scale on hover
className="transition-transform hover:scale-105"

// Sidebar collapse (existing pattern)
// Uses width transition with overflow-hidden
```

### When to Animate

✅ State changes (loading → loaded, collapsed → expanded)
✅ Hover feedback on interactive elements
✅ Toast notifications entering/exiting
✅ Modal/dialog open/close

❌ Avoid animation on scroll (performance)
❌ Avoid delays > 50ms on hover states
❌ Avoid bouncy/elastic easing (feels toy-like)

## UX Patterns

### Form Validation

Use field-level validation with `ValidatedInput`. Show errors inline, not in toasts.

```tsx
<ValidatedInput
  value={name}
  onChange={handleChange}
  error={errors.name}
  placeholder="Recipe name"
/>
```

### Loading States

- Use skeleton loaders for content that has a known shape
- Use spinners for indeterminate waits
- Always show loading state for async operations > 200ms

### Empty States

Provide helpful context and a clear action:

```tsx
<div className="text-center py-12">
  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
  <h3 className="mt-4 text-lg font-medium">No recipes yet</h3>
  <p className="text-muted-foreground">Get started by adding your first recipe.</p>
  <Button className="mt-4">Add Recipe</Button>
</div>
```

## Reference Files

- **[design-system.md](references/design-system.md)** - Extended color palette, typography scale, responsive breakpoints
- **[component-patterns.md](references/component-patterns.md)** - Detailed component API reference and composition patterns
- **[ux-guidelines.md](references/ux-guidelines.md)** - Interaction patterns, accessibility checklist, responsive behavior

## File Locations

| Need to... | Path |
|------------|------|
| Add/edit colors | `src/app/globals.css` |
| Add shadcn component | `npx shadcn@latest add [name]` |
| Create shared component | `src/components/common/` |
| Create recipe component | `src/components/recipe/` |
| Add form component | `src/components/forms/` |
| Modify layout | `src/components/layout/` |
