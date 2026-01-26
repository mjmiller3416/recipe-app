# Design Tokens Reference

> Complete reference of CSS variables and Tailwind classes available in the Meal Genie design system.

## Color Tokens

### Text Colors

| Purpose | Tailwind Class | CSS Variable | Usage |
|---------|----------------|--------------|-------|
| Primary text | `text-foreground` | `--foreground` | Headings, body text |
| Subtle text | `text-foreground-subtle` | `--foreground-subtle` | Secondary content |
| Muted text | `text-muted-foreground` | `--muted-foreground` | Placeholders, helper text |
| Disabled text | `text-foreground-disabled` | `--foreground-disabled` | Disabled states |
| Accent text | `text-primary` | `--primary` | Links, highlighted text |
| Error text | `text-destructive` | `--destructive` | Validation errors |
| Success text | `text-success` | `--success` | Confirmation messages |

### Background Colors

| Purpose | Tailwind Class | CSS Variable | Usage |
|---------|----------------|--------------|-------|
| Page background | `bg-background` | `--background` | Root/body |
| Subtle background | `bg-background-subtle` | `--background-subtle` | Slightly raised |
| Intense background | `bg-background-intense` | `--background-intense` | Modals, overlays |
| Elevated surface | `bg-elevated` | `--elevated` | Cards, panels |
| Card surface | `bg-card` | `--card` | Card components |
| Sidebar | `bg-sidebar` | `--sidebar` | Navigation sidebar |
| Muted surface | `bg-muted` | `--muted` | Secondary containers |
| Hover state | `bg-hover` | `--hover` | Hover backgrounds |
| Accent surface | `bg-accent` | `--accent` | Dietary badges |
| Input background | `bg-input` | `--input` | Form inputs |
| Popover | `bg-popover` | `--popover` | Dropdowns, popovers |

### Primary Colors (Purple)

| Purpose | Tailwind Class | CSS Variable |
|---------|----------------|--------------|
| Primary | `bg-primary` / `text-primary` | `--primary` |
| Primary dark | `bg-primary-dark` | `--primary-dark` |
| Primary light | `bg-primary-light` | `--primary-light` |
| Primary hover | `hover:bg-primary-hover` | `--primary-hover` |
| Primary active | `active:bg-primary-active` | `--primary-active` |
| Text on primary | `text-primary-foreground` | `--primary-foreground` |
| Primary surface | `bg-primary-surface` | `--primary-surface` |
| Text on surface | `text-primary-on-surface` | `--primary-on-surface` |

### Secondary Colors (Teal)

| Purpose | Tailwind Class | CSS Variable |
|---------|----------------|--------------|
| Secondary | `bg-secondary` / `text-secondary` | `--secondary` |
| Secondary hover | `hover:bg-secondary-hover` | `--secondary-hover` |
| Secondary active | `active:bg-secondary-active` | `--secondary-active` |
| Text on secondary | `text-secondary-foreground` | `--secondary-foreground` |
| Secondary surface | `bg-secondary-surface` | `--secondary-surface` |
| Text on surface | `text-secondary-on-surface` | `--secondary-on-surface` |

### Status Colors

| Status | Background | Text | Usage |
|--------|------------|------|-------|
| Success | `bg-success` | `text-success` | Confirmations |
| Warning | `bg-warning` | `text-warning` | Cautions |
| Error | `bg-error` | `text-error` | Errors, favorites |
| Destructive | `bg-destructive` | `text-destructive` | Delete actions |
| Info | `bg-info` | `text-info` | Informational |

### Border Colors

| Purpose | Tailwind Class | CSS Variable |
|---------|----------------|--------------|
| Default border | `border-border` | `--border` |
| Subtle border | `border-border-subtle` | `--border-subtle` |
| Strong border | `border-border-strong` | `--border-strong` |
| Input border | `border-input` | `--input` |
| Focus ring | `ring-ring` | `--ring` |
| Error border | `border-destructive` | `--destructive` |

---

## Spacing Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| 1 | 4px | `gap-1`, `p-1`, `m-1` | Icon + text |
| 2 | 8px | `gap-2`, `p-2`, `m-2` | Related elements |
| 3 | 12px | `gap-3`, `p-3`, `m-3` | List items |
| 4 | 16px | `gap-4`, `p-4`, `m-4` | Form fields, card content |
| 5 | 20px | `gap-5`, `p-5`, `m-5` | - |
| 6 | 24px | `gap-6`, `p-6`, `m-6` | Sections, dialog content |
| 8 | 32px | `gap-8`, `p-8`, `m-8` | Major page sections |
| 10 | 40px | `gap-10`, `p-10`, `m-10` | - |
| 12 | 48px | `gap-12`, `p-12`, `m-12` | Large spacing |

---

## Sizing Scale

### Component Heights

| Size | Height | Class | Usage |
|------|--------|-------|-------|
| sm | 32px | `h-8` | Dense tables, compact UI |
| default | 40px | `h-10` | Standard forms |
| lg | 48px | `h-12` | Hero CTAs, touch targets |

### Icon Sizes

| Size | Class | Usage |
|------|-------|-------|
| 16px | `size-4` | In buttons, inline |
| 20px | `size-5` | Standalone small |
| 24px | `size-6` | Standalone medium |
| 32px | `size-8` | Large icons |

---

## Border Radius

| Element | Class | Pixels |
|---------|-------|--------|
| Buttons, inputs | `rounded-md` | 6px |
| Cards, dialogs | `rounded-lg` | 8px |
| Feature cards, hero | `rounded-xl` | 12px |
| Pills, badges | `rounded-full` | 9999px |

---

## Shadow System

### Standard Shadows

| Name | Class | Usage |
|------|-------|-------|
| Small | `shadow-sm` | Subtle elevation |
| Medium | `shadow-md` | Cards |
| Large | `shadow-lg` | Dropdowns |
| Extra large | `shadow-xl` | Modals |

### Layered Depth Shadows

| Name | Class | Usage |
|------|-------|-------|
| Raised | `shadow-raised` | Cards, panels |
| Elevated | `shadow-elevated` | Hover states, modals |
| Floating | `shadow-floating` | Popovers, tooltips |
| Inset small | `shadow-inset-sm` | Pressed buttons |
| Inset medium | `shadow-inset-md` | Pressed containers |

### Glow Effects

| Name | Class | Usage |
|------|-------|-------|
| Primary glow | `shadow-glow-primary` | Focus, highlights |
| Secondary glow | `shadow-glow-secondary` | Secondary focus |

---

## Surface Utilities

Pre-composed surface classes for consistent depth:

```tsx
// Base level (page background)
className="surface-base"
// → bg-background, border-border

// Raised (cards)
className="surface-raised"
// → bg-elevated, border-border, shadow-raised

// Elevated (modals, dropdowns)
className="surface-elevated"
// → bg-elevated, border-border-strong, shadow-elevated

// Floating (popovers)
className="surface-floating"
// → bg-popover, border-border-strong, shadow-floating
```

---

## Animation Tokens

### Duration

| Name | Value | Class | Usage |
|------|-------|-------|-------|
| Instant | 100ms | `duration-100` | Micro-interactions |
| Fast | 150ms | `duration-150` | Button states |
| Normal | 300ms | `duration-300` | Standard transitions |
| Slow | 500ms | `duration-500` | Page transitions |

### Easing

| Name | Class | Usage |
|------|-------|-------|
| Physical | `ease-physical` | Natural movement |
| Bounce | `ease-bounce` | Playful elements |
| Snap | `ease-snap` | Quick snaps |

### Animation Classes

```tsx
className="animate-fade-in"      // Fade in
className="animate-slide-up"     // Slide up + fade
className="animate-scale-in"     // Scale up + fade
className="animate-pulse-soft"   // Gentle pulse
className="animate-bounce-subtle" // Subtle bounce
```

---

## Interactive Utilities

Pre-composed interaction classes:

```tsx
// Full interactive (lift + press)
className="interactive"

// Subtle (smaller elements)
className="interactive-subtle"

// Press only (shrink on click)
className="pressable"

// Lift only (rise on hover)
className="liftable"

// Bouncy (playful spring)
className="bouncy"
```

---

## Typography Utilities

| Class | Font Size | Weight | Usage |
|-------|-----------|--------|-------|
| `text-page-title` | 24px / bold | 700 | Page headings |
| `text-section-header` | 18px / semibold | 600 | Section titles |
| `text-card-title` | 16px / semibold | 600 | Card headings |
| `text-body` | 14px / normal | 400 | Body text |
| `text-meta` | 12px / medium | 500 | Metadata, captions |
| `text-ui` | 14px / medium | 500 | Buttons, inputs |

---

## Z-Index Scale

| Layer | Class | Usage |
|-------|-------|-------|
| Base | `z-0` | Default content |
| Dropdown | `z-10` | Menus, popovers |
| Sticky | `z-20` | Sticky headers |
| Modal overlay | `z-40` | Dialog backdrops |
| Modal content | `z-50` | Dialog content |
| Toast | `z-[100]` | Notifications |

---

## Recipe-Specific Tokens

| Purpose | Tailwind Class | Usage |
|---------|----------------|-------|
| Category badge bg | `bg-recipe-category-bg` | Recipe categories |
| Category badge text | `text-recipe-category-text` | Category text |
| Meal type badge bg | `bg-recipe-meal-type-bg` | Meal types |
| Meal type badge text | `text-recipe-meal-type-text` | Meal type text |
| Dietary badge bg | `bg-recipe-dietary-bg` | Dietary labels |
| Favorite color | `text-recipe-favorite` | Heart icons |
