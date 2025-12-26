# Design System Tokens Reference

Complete reference for all CSS variables and their Tailwind class equivalents. Source: `frontend/src/app/globals.css`

> **Rule:** Always use CSS variables or Tailwind classes — never hardcode hex values.

---

## Quick Reference

| Category | CSS Variable | Tailwind Class |
|----------|--------------|----------------|
| Primary | `--primary` | `bg-primary`, `text-primary` |
| Secondary | `--secondary` | `bg-secondary`, `text-secondary` |
| Background | `--background` | `bg-background` |
| Foreground | `--foreground` | `text-foreground` |
| Card | `--card` | `bg-card` |
| Border | `--border` | `border-border` |

---

## Brand Colors

### Primary (Purple)

The main brand color used for CTAs, active states, and key focal points.

| Token | Value (Dark) | Value (Light) | Tailwind | Use Case |
|-------|--------------|---------------|----------|----------|
| `--primary` | `#8b5cf6` | `#8b5cf6` | `bg-primary`, `text-primary` | Main buttons, active tabs, category badges |
| `--primary-hover` | `#7c3aed` | `#7c3aed` | `bg-primary-hover` | Hover state for primary elements |
| `--primary-active` | `#6d28d9` | `#6d28d9` | `bg-primary-active` | Pressed/active state |
| `--primary-light` | `#a78bfa` | `#c4b5fd` | `bg-primary-light` | Subtle highlights, backgrounds |
| `--primary-dark` | `#7c3aed` | `#7c3aed` | `bg-primary-dark` | Emphasis, borders |
| `--primary-foreground` | `#ffffff` | `#ffffff` | `text-primary-foreground` | Text on primary background |

**Usage Examples:**
```tsx
// Primary button (default)
<Button variant="default">Save Recipe</Button>

// Custom primary styling
<div className="bg-primary text-primary-foreground">
  Featured Content
</div>

// Hover state in custom component
<div className="bg-primary hover:bg-primary-hover transition-colors">
  Interactive Element
</div>
```

### Secondary (Teal)

Secondary brand color for alternative actions and meal-type distinctions.

| Token | Value (Dark) | Value (Light) | Tailwind | Use Case |
|-------|--------------|---------------|----------|----------|
| `--secondary` | `#14b8a6` | `#14b8a6` | `bg-secondary`, `text-secondary` | Secondary buttons, meal type badges |
| `--secondary-hover` | `#0d9488` | `#0d9488` | `bg-secondary-hover` | Hover state |
| `--secondary-active` | `#0f766e` | `#0f766e` | `bg-secondary-active` | Pressed/active state |
| `--secondary-foreground` | `#ffffff` | `#ffffff` | `text-secondary-foreground` | Text on secondary background |

**Usage Examples:**
```tsx
// Secondary button
<Button variant="secondary">View All</Button>

// Meal type badge
<Badge variant="secondary">Dinner</Badge>
```

### Neutral

For non-brand UI elements that need to be visually quiet.

| Token | Value (Dark) | Value (Light) | Tailwind | Use Case |
|-------|--------------|---------------|----------|----------|
| `--neutral` | `#525252` | `#d4d4d4` | `bg-neutral` | Neutral backgrounds, dividers |
| `--neutral-foreground` | `#f5f5f5` | `#1a1a1a` | `text-neutral-foreground` | Text on neutral |

---

## Status Colors

For communicating state and feedback to users.

| Token | Value | Tailwind | Use Case |
|-------|-------|----------|----------|
| `--success` | `#10b981` | `bg-success`, `text-success` | Success messages, completed states |
| `--warning` | `#f59e0b` | `bg-warning`, `text-warning` | Warning messages, caution states |
| `--error` | `#ef4444` | `bg-error`, `text-error` | Error messages, validation errors |
| `--destructive` | `#ef4444` | `bg-destructive` | Delete buttons, destructive actions |
| `--info` | `#3b82f6` | `bg-info`, `text-info` | Informational messages |
| `--info-foreground` | `#ffffff` | `text-info-foreground` | Text on info background |

**Usage Examples:**
```tsx
// Destructive button
<Button variant="destructive">Delete Recipe</Button>

// Error state
<p className="text-destructive">This field is required</p>

// Success toast
<div className="bg-success text-white">Recipe saved!</div>
```

---

## Surface Hierarchy

Surfaces create visual depth and separation. Use these in order of elevation.

| Token | Value (Dark) | Value (Light) | Tailwind | Use Case |
|-------|--------------|---------------|----------|----------|
| `--background` | `#1a1a1a` | `#f5f5f5` | `bg-background` | Main page background |
| `--background-subtle` | `#212121` | `#f3f3f3` | `bg-background-subtle` | Slightly raised from background |
| `--background-intense` | `#151515` | `#ffffff` | `bg-background-intense` | Modal backdrops, deepest layer |
| `--sidebar` | `#252525` | `#e8e8e8` | `bg-sidebar` | Sidebar background |
| `--elevated` | `#2f2f2f` | `#ffffff` | `bg-elevated` | Cards, raised surfaces |
| `--card` | `#2f2f2f` | `#ffffff` | `bg-card` | Card backgrounds |
| `--popover` | `#2f2f2f` | `#ffffff` | `bg-popover` | Dropdowns, tooltips, menus |
| `--input` | `#2f2f2f` | `#ffffff` | `bg-input` | Input field backgrounds |
| `--hover` | `#3d3d3d` | `#e0e0e0` | `bg-hover` | Hover state background |

**Elevation Order (bottom to top):**
```
background-intense  (deepest - modals backdrop)
    ↓
background         (page level)
    ↓
background-subtle  (slightly raised)
    ↓
sidebar           (navigation)
    ↓
elevated/card     (content cards)
    ↓
popover           (floating elements)
```

**Usage Examples:**
```tsx
// Page layout
<main className="bg-background min-h-screen">
  <aside className="bg-sidebar">Navigation</aside>
  <div className="bg-card rounded-lg p-6">Card Content</div>
</main>

// Dropdown
<DropdownMenuContent className="bg-popover">
  <DropdownMenuItem>Option 1</DropdownMenuItem>
</DropdownMenuContent>
```

---

## Text Colors

Hierarchy for text emphasis. Use consistently across the app.

| Token | Value (Dark) | Value (Light) | Tailwind | Use Case |
|-------|--------------|---------------|----------|----------|
| `--foreground` | `#f5f5f5` | `#1a1a1a` | `text-foreground` | Primary text, headings |
| `--foreground-subtle` | `#d4d4d4` | `#4b5563` | `text-foreground-subtle` | Secondary emphasis |
| `--muted` | `#b3b3b3` | `#6b7280` | `text-muted` | Helper text, metadata |
| `--muted-foreground` | `#a3a3a3` | `#6b7280` | `text-muted-foreground` | Shadcn compatibility |
| `--foreground-disabled` | `#737373` | `#9ca3af` | `text-foreground-disabled` | Disabled text |

**Text Hierarchy:**
```
foreground         → Headings, primary content (most prominent)
    ↓
foreground-subtle  → Subheadings, secondary content
    ↓
muted              → Captions, timestamps, metadata
    ↓
foreground-disabled → Disabled, placeholder text (least prominent)
```

**Usage Examples:**
```tsx
<h1 className="text-foreground">Recipe Title</h1>
<p className="text-foreground-subtle">A delicious meal for the family</p>
<span className="text-muted">Added 2 days ago</span>
<input placeholder="Search..." className="placeholder:text-foreground-disabled" />
```

---

## Border Colors

Three levels of border emphasis.

| Token | Value (Dark) | Value (Light) | Tailwind | Use Case |
|-------|--------------|---------------|----------|----------|
| `--border` | `#3d3d3d` | `#d6d6d6` | `border-border` | Default borders |
| `--border-subtle` | `#2d2d2d` | `#e5e5e5` | `border-border-subtle` | Subtle dividers, light borders |
| `--border-strong` | `#525252` | `#a3a3a3` | `border-border-strong` | Emphasized borders, focus states |

**Usage Examples:**
```tsx
// Standard card border
<div className="border border-border rounded-lg">Card</div>

// Subtle separator
<hr className="border-border-subtle" />

// Emphasized/active border
<div className="border-2 border-border-strong">Selected Item</div>
```

---

## Accent & UI Elements

| Token | Value (Dark) | Value (Light) | Tailwind | Use Case |
|-------|--------------|---------------|----------|----------|
| `--accent` | `#3d3d3d` | `#e5e7eb` | `bg-accent` | Hover backgrounds, dietary badges |
| `--accent-foreground` | `#f5f5f5` | `#374151` | `text-accent-foreground` | Text on accent |
| `--ring` | `#8b5cf6` | `#8b5cf6` | `ring-ring` | Focus ring color |

**Usage Examples:**
```tsx
// Ghost button hover
<Button variant="ghost" className="hover:bg-accent">Menu Item</Button>

// Focus ring (automatic with Shadcn)
<Input className="focus-visible:ring-ring" />
```

---

## Recipe-Specific Tokens

Pre-computed tokens for recipe card elements. These reference the brand colors for consistency.

| Token | References | Tailwind | Use Case |
|-------|------------|----------|----------|
| `--recipe-category-bg` | `--primary` | — | Category badge background |
| `--recipe-category-text` | `--primary-foreground` | — | Category badge text |
| `--recipe-meal-type-bg` | `--secondary` | — | Meal type badge background |
| `--recipe-meal-type-text` | `--secondary-foreground` | — | Meal type badge text |
| `--recipe-dietary-bg` | `--accent` | — | Dietary badge background |
| `--recipe-dietary-text` | `--accent-foreground` | — | Dietary badge text |
| `--recipe-favorite` | `--error` | — | Favorite heart icon |
| `--recipe-favorite-hover` | `#dc2626` | — | Favorite heart hover |

**CSS Utility Classes:**
```css
.recipe-category-badge    /* Purple - for cuisine/category */
.recipe-meal-type-badge   /* Teal - for breakfast/lunch/dinner */
.recipe-dietary-badge     /* Gray - for vegan/gluten-free/etc */
.recipe-favorite          /* Red - for favorite heart */
```

**Usage Examples:**
```tsx
// Using utility classes
<span className="recipe-category-badge px-2 py-0.5 rounded-full">
  Italian
</span>

// Using Badge component
<Badge variant="default">Italian</Badge>      // Purple
<Badge variant="secondary">Dinner</Badge>     // Teal
<Badge variant="outline">Vegan</Badge>        // Outline/Accent
```

---

## Disabled States

| Token | Value (Dark) | Value (Light) | Tailwind | Use Case |
|-------|--------------|---------------|----------|----------|
| `--disabled-bg` | `#3d3d3d` | `#e5e7eb` | `bg-disabled-bg` | Disabled element background |
| `--disabled-fg` | `#737373` | `#9ca3af` | `text-disabled-fg` | Disabled element text |
| `--disabled-opacity` | `0.5` | `0.5` | — | Opacity for disabled elements |

**Usage Examples:**
```tsx
// Disabled button (handled by Shadcn)
<Button disabled>Cannot Submit</Button>

// Custom disabled state
<div className="bg-disabled-bg text-disabled-fg opacity-50">
  Unavailable Option
</div>
```

---

## Shadows

Shadows adapt between dark and light mode for appropriate contrast.

| Token | Tailwind | Use Case |
|-------|----------|----------|
| `--shadow-sm` | `shadow-sm` | Subtle elevation (inputs, small cards) |
| `--shadow-md` | `shadow-md` | Medium elevation (cards, panels) |
| `--shadow-lg` | `shadow-lg` | High elevation (modals, dropdowns) |
| `--shadow-xl` | `shadow-xl` | Maximum elevation (floating elements) |

**Dark Mode:** Shadows are more intense (0.5 opacity) for visibility
**Light Mode:** Shadows are subtle (0.1 opacity) for softness

**Usage Examples:**
```tsx
<div className="shadow-sm">Subtle card</div>
<div className="shadow-md">Standard card</div>
<div className="shadow-lg">Floating panel</div>
<div className="shadow-xl">Modal dialog</div>
```

---

## Overlays

For modal backdrops and dimming effects.

| Token | Value | Tailwind | Use Case |
|-------|-------|----------|----------|
| `--overlay` | `rgba(0,0,0,0.5)` | `bg-overlay` | Standard modal backdrop |
| `--overlay-light` | `rgba(0,0,0,0.25)` | `bg-overlay-light` | Subtle dimming |
| `--overlay-strong` | `rgba(0,0,0,0.75)` | `bg-overlay-strong` | Heavy dimming, image overlays |

---

## Status Indicators

For user presence or system status.

| Token | Value | Tailwind | Use Case |
|-------|-------|----------|----------|
| `--status-online` | `#10b981` | `bg-status-online` | Online/available |
| `--status-offline` | `#6b7280` (dark) / `#9ca3af` (light) | `bg-status-offline` | Offline/unavailable |
| `--status-busy` | `#ef4444` | `bg-status-busy` | Busy/do not disturb |
| `--status-away` | `#f59e0b` | `bg-status-away` | Away/idle |

---

## Chart Colors

For data visualization consistency.

| Token | Value | Tailwind | Use Case |
|-------|-------|----------|----------|
| `--chart-1` | `#8b5cf6` | `bg-chart-1` | Primary data series (purple) |
| `--chart-2` | `#14b8a6` | `bg-chart-2` | Secondary series (teal) |
| `--chart-3` | `#f59e0b` | `bg-chart-3` | Tertiary series (amber) |
| `--chart-4` | `#ec4899` | `bg-chart-4` | Fourth series (pink) |
| `--chart-5` | `#10b981` | `bg-chart-5` | Fifth series (green) |
| `--chart-6` | `#6366f1` | `bg-chart-6` | Sixth series (indigo) |

---

## Typography

| Token | Value | Tailwind | Use Case |
|-------|-------|----------|----------|
| `--font-sans` | `var(--font-geist-sans)` | `font-sans` | Body text, UI elements |
| `--font-mono` | `var(--font-geist-mono)` | `font-mono` | Code, technical content |

---

## Common Patterns

### Card with All Tokens
```tsx
<div className="bg-card text-card-foreground border border-border rounded-lg shadow-md p-6">
  <h3 className="text-foreground font-semibold">Card Title</h3>
  <p className="text-muted mt-2">Card description text</p>
  <div className="mt-4 flex gap-2">
    <Button variant="default">Primary</Button>
    <Button variant="ghost">Cancel</Button>
  </div>
</div>
```

### Form Field
```tsx
<div className="space-y-2">
  <Label className="text-foreground">Email</Label>
  <Input
    className="bg-input border-border focus-visible:ring-ring"
    placeholder="Enter email..."
  />
  <p className="text-muted text-sm">We'll never share your email.</p>
</div>
```

### Status Message
```tsx
// Error
<div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3">
  <p>Something went wrong. Please try again.</p>
</div>

// Success
<div className="bg-success/10 text-success border border-success/20 rounded-md p-3">
  <p>Recipe saved successfully!</p>
</div>
```
