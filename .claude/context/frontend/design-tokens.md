# Design Tokens

**Semantic color, spacing, and sizing tokens for consistent design.**

Always use semantic tokens from `globals.css`. Never hardcode Tailwind colors.

## Semantic Color Tokens

### Text

- `text-foreground` — Primary text (headings, body)
- `text-muted-foreground` — Secondary text, placeholders, icons
- `text-primary` — Accent text, links, interactive elements
- `text-destructive` — Error messages, delete actions
- `text-card-foreground` — Text on card backgrounds

### Backgrounds

- `bg-background` — Main page background
- `bg-card` — Card, panel, modal backgrounds
- `bg-elevated` — Elevated cards (subtle depth)
- `bg-muted` — Subtle surfaces, disabled states
- `bg-accent` — Hover states, subtle highlights
- `bg-primary` — Primary action backgrounds
- `bg-destructive` — Error backgrounds, delete buttons

### Borders

- `border-border` — Default borders
- `border-input` — Form input borders
- `border-destructive` — Error state borders

## Recipe-Specific Tokens

**Category badges:**
- `bg-recipe-category-bg` + `text-recipe-category-text`
  - Example: "Breakfast", "Dinner", "Dessert"

**Meal type badges:**
- `bg-recipe-meal-type-bg` + `text-recipe-meal-type-text`
  - Example: "Main Dish", "Side Dish", "Appetizer"

**Dietary restriction badges:**
- `bg-recipe-dietary-bg` + `text-recipe-dietary-text`
  - Example: "Vegetarian", "Gluten-Free", "Dairy-Free"

## Spacing Scale

Use Tailwind scale exclusively. No arbitrary pixel values.

**Gap (between flex/grid items):**
- `gap-2` (8px) — Icon + text, related elements
- `gap-4` (16px) — Form fields, card sections
- `gap-6` (24px) — Content sections
- `gap-8` (32px) — Major layout sections

**Space-y (vertical spacing):**
- `space-y-2` — Label to input
- `space-y-4` — Between form fields
- `space-y-6` — Between sections
- `space-y-8` — Between major content blocks

**Padding:**
- `p-4` (16px) — Card padding
- `p-6` (24px) — Page sections
- `px-4` (16px) — Button horizontal padding
- `py-2` (8px) — Button vertical padding

## Sizing Scale

**Heights:**
- `h-8` (32px) — Small buttons, dense UI
- `h-10` (40px) — Default inputs, buttons
- `h-12` (48px) — Large buttons, touch targets

**Widths:**
- `w-full` — Fill container
- `w-fit` — Fit content
- `w-[number]` — Use Tailwind scale (w-64, w-96, etc.)

**Max widths:**
- `max-w-sm` (384px) — Narrow forms
- `max-w-2xl` (672px) — Content width
- `max-w-7xl` (1280px) — Page max width

## Icon Sizes

- `size-4` (16px) — Inline with text
- `size-5` (20px) — Standalone small
- `size-6` (24px) — Standalone medium
- `size-8` (32px) — Large icons, empty states

**Always use `strokeWidth={1.5}` on lucide-react icons.**

## Interactive State Classes

For custom interactive elements (not shadcn components):

```tsx
// Interactive card (standard hover)
<Card className="interactive cursor-pointer">

// Subtle interaction (smaller hover effect)
<Card className="interactive-subtle cursor-pointer">
```

**Note:** shadcn components have built-in hover/focus states. Don't duplicate classes on Button, Input, etc.