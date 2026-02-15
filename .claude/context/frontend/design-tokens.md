# Design Tokens

**Semantic color, spacing, and sizing tokens. Always use these — never hardcode Tailwind colors.**

All tokens defined in `globals.css`. Both dark (default) and light modes are fully supported.

## Color Tokens

### Text
- `text-foreground` — Primary text (headings, body)
- `text-muted-foreground` — Secondary text, placeholders, icons
- `text-foreground-subtle` — Between foreground and muted
- `text-primary` — Accent text, links, interactive elements
- `text-destructive` — Error messages, delete actions
- `text-card-foreground` — Text on card backgrounds

### Backgrounds
- `bg-background` — Main page background
- `bg-background-subtle` — Between background and sidebar
- `bg-background-intense` — Deeper (modals, overlays)
- `bg-card` — Card, panel, modal backgrounds
- `bg-sidebar` — Sidebar background
- `bg-elevated` — Elevated cards (subtle depth)
- `bg-hover` — Hover state background
- `bg-muted` — Subtle surfaces, disabled states
- `bg-accent` — Hover states, subtle highlights
- `bg-primary` / `bg-secondary` — Brand color backgrounds
- `bg-destructive` — Error backgrounds, delete buttons

### Primary/Secondary Surface Variants
- `bg-primary-surface` / `hover:bg-primary-surface-hover` — Subtle brand-tinted backgrounds
- `text-primary-on-surface` — Text on primary surfaces
- `border-primary-muted` — Subtle brand-tinted borders
- `bg-secondary-surface` / `hover:bg-secondary-surface-hover` — Subtle teal-tinted backgrounds
- `text-secondary-on-surface` — Text on secondary surfaces
- `bg-secondary-surface-alpha` / `border-secondary-border-alpha` — Transparent secondary surfaces (info boxes, stat cards)

### Borders
- `border-border` — Default borders
- `border-subtle` — Lighter than default
- `border-strong` — Stronger than default
- `border-input` — Form input borders
- `border-destructive` — Error state borders

### Status Colors
- `text-success` / `bg-success` — Success states
- `text-warning` / `bg-warning` — Warning states
- `text-error` / `bg-error` — Error states
- `text-info` / `bg-info` — Informational states
- `bg-success-surface` / `border-success-surface-border` — Subtle success backgrounds

### Chart Colors
- `--chart-1` (purple), `--chart-2` (teal), `--chart-3` (amber), `--chart-4` (pink), `--chart-5` (green), `--chart-6` (indigo)
- Used by `StatCard` for color presets

## Recipe-Specific Tokens

- `bg-recipe-category-bg` + `text-recipe-category-text` — Category badges (purple)
- `bg-recipe-meal-type-bg` + `text-recipe-meal-type-text` — Meal type badges (teal)
- `bg-recipe-dietary-bg` + `text-recipe-dietary-text` — Dietary restriction badges

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

**Padding:**
- `p-4` — Card padding
- `p-6` — Page sections

## Sizing Scale

**Heights:** `h-8` (32px small), `h-10` (40px default), `h-12` (48px large)

**Max widths:** `max-w-sm` (384px narrow), `max-w-2xl` (672px content), `max-w-7xl` (1280px page)

## Icon Sizes

- `size-4` (16px) — Inline with text
- `size-5` (20px) — Standalone small
- `size-6` (24px) — Standalone medium
- `size-8` (32px) — Large icons, empty states

**Always use `strokeWidth={1.5}` on lucide-react icons.**

## Shadow System (Layered Depth)

- `shadow-raised` — Cards, slight elevation
- `shadow-elevated` — Popovers, dropdowns
- `shadow-floating` — Modals, floating elements
- `shadow-glow-primary` / `shadow-glow-secondary` — Focus/active glow effects

**Warning:** `overflow-hidden` clips shadows. Use `widget-column` utility for shadow-safe containers.

## Surface Utilities

Pre-composed background + shadow combinations:
- `surface-base` — Flat card background
- `surface-raised` — Card with raised shadow
- `surface-elevated` — Elevated panel
- `surface-floating` — Floating element

## Interactive Composites

Pre-composed hover/active animations (use on custom interactive elements, NOT on shadcn components):
- `pressable` — Scale-down on press
- `liftable` — Lift + shadow on hover
- `interactive` — Lift + shadow + scale-down on press (standard)
- `interactive-subtle` — Smaller lift effect
- `bouncy` — Spring animation on press

## Typography Utilities

Pre-composed font-size + weight + color combinations:
- `text-page-title` — Page headings
- `text-section-header` — Section headings
- `text-card-title` — Card titles
- `text-body` — Body text
- `text-meta` — Metadata, timestamps
- `text-ui` — UI labels, small text

## Animation Tokens

**Durations:** `--duration-instant` (100ms), `--duration-fast` (150ms), `--duration-normal` (300ms), `--duration-slow` (500ms)

**Easing:** `--ease-default`, `--ease-in`, `--ease-out`, `--ease-bounce`, `--ease-physical`, `--ease-snap`

Custom utilities: `ease-physical`, `ease-bounce`, `ease-snap`
