# Design Guide

Ensure every UI component looks modern, professional, and consistent with the design system.

## Usage

Reference this skill whenever building any UI component. All UI work must follow these principles.

---

## Core Principles

1. **Use the design system** - Always reference `frontend/src/app/globals.css` for colors and variables
2. **No generic gradients** - Solid colors only; gradients look dated and clash with the system
3. **8px grid spacing** - All spacing uses multiples of 8: `8, 16, 24, 32, 48, 64px`
4. **Simplicity over decoration** - Every visual element must serve a purpose

---

## Color Palette (from globals.css)

### Brand Colors
| Purpose | Variable | Value |
|---------|----------|-------|
| Primary | `--primary` | `#8b5cf6` (Purple) |
| Primary Hover | `--primary-hover` | `#7c3aed` |
| Primary Active | `--primary-active` | `#6d28d9` |
| Secondary | `--secondary` | `#14b8a6` (Teal) |
| Secondary Hover | `--secondary-hover` | `#0d9488` |

### Backgrounds
| Purpose | Variable | Dark Mode | Light Mode |
|---------|----------|-----------|------------|
| Main background | `--background` | `#1a1a1a` | `#f5f5f5` |
| Cards/Elevated | `--elevated` | `#2f2f2f` | `#ffffff` |
| Hover state | `--hover` | `#3d3d3d` | `#e0e0e0` |
| Sidebar | `--sidebar` | `#252525` | `#e8e8e8` |

### Text Colors
| Purpose | Variable | Dark Mode | Light Mode |
|---------|----------|-----------|------------|
| Primary text | `--foreground` | `#f5f5f5` | `#1a1a1a` |
| Muted text | `--muted` | `#b3b3b3` | `#6b7280` |
| Disabled text | `--foreground-disabled` | `#737373` | `#9ca3af` |

### Status Colors
| Purpose | Variable | Value |
|---------|----------|-------|
| Success | `--success` | `#10b981` |
| Warning | `--warning` | `#f59e0b` |
| Error | `--error` | `#ef4444` |
| Info | `--info` | `#3b82f6` |

### Borders
| Purpose | Variable | Dark Mode | Light Mode |
|---------|----------|-----------|------------|
| Default border | `--border` | `#3d3d3d` | `#d6d6d6` |
| Subtle border | `--border-subtle` | `#2d2d2d` | `#e5e5e5` |
| Strong border | `--border-strong` | `#525252` | `#a3a3a3` |

---

## Spacing System (8px Grid)

Use ONLY these spacing values:

| Token | Value | Use Case |
|-------|-------|----------|
| `xs` | `4px` | Icon padding, tight gaps |
| `sm` | `8px` | Between related elements |
| `md` | `16px` | Standard padding, gaps |
| `lg` | `24px` | Section spacing |
| `xl` | `32px` | Card padding, major gaps |
| `2xl` | `48px` | Section separators |
| `3xl` | `64px` | Page-level spacing |

**Tailwind mappings:** `p-1`=4px, `p-2`=8px, `p-4`=16px, `p-6`=24px, `p-8`=32px, `p-12`=48px, `p-16`=64px

---

## Typography

### Hierarchy Rules
- **Max 2 fonts** - System uses Geist Sans and Geist Mono
- **Minimum 16px** for body text (readability requirement)
- **Clear visual hierarchy** - Size difference between levels should be obvious

### Recommended Sizes
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 / Page title | `32-40px` | `700` | `1.2` |
| H2 / Section title | `24-28px` | `600` | `1.3` |
| H3 / Card title | `18-20px` | `600` | `1.4` |
| Body text | `16px` | `400` | `1.5` |
| Small / Caption | `14px` | `400` | `1.4` |
| Label / Badge | `12-13px` | `500` | `1.3` |

---

## Shadows

Use shadows from the design system. Shadows should be **subtle**, not heavy.

| Level | Variable | Use Case |
|-------|----------|----------|
| Small | `--shadow-sm` | Buttons, small elements |
| Medium | `--shadow-md` | Cards, dropdowns |
| Large | `--shadow-lg` | Modals, popovers |
| XL | `--shadow-xl` | Floating elements |

**Dark mode shadows are more pronounced** (higher opacity) than light mode - this is already handled in globals.css.

---

## Border Radius

Not everything needs to be rounded. Use consistent values:

| Element | Radius |
|---------|--------|
| Buttons | `6-8px` |
| Cards | `8-12px` |
| Inputs | `6px` |
| Badges/Pills | `9999px` (full) or `4px` |
| Modals | `12-16px` |
| Avatars | `9999px` (circle) |

---

## Interactive States

Every interactive element MUST have clear states:

### Buttons
```
Default  → background: --primary
Hover    → background: --primary-hover
Active   → background: --primary-active
Disabled → background: --disabled-bg, color: --disabled-fg, opacity: 0.5
Focus    → ring: --ring (2px offset)
```

### Form Inputs
```
Default  → border: --border, background: --input
Focus    → border: --ring, ring: --ring
Error    → border: --error
Disabled → background: --disabled-bg, color: --disabled-fg
```

### Cards/Clickable Areas
```
Default  → background: --card
Hover    → background: --hover OR subtle shadow increase
Active   → slight scale (0.98) or shadow decrease
```

---

## Component Patterns

### Buttons (Good)
- Subtle shadow (`--shadow-sm`)
- Proper padding (`px-4 py-2` or `px-6 py-3`)
- Clear hover state (color shift, not just opacity)
- No gradients
- Minimum height 40px for touch targets

### Buttons (Bad)
- Heavy drop shadows
- Gradient backgrounds
- No hover state
- Tiny padding
- Text too small to read

### Cards (Good)
- Clean border OR subtle shadow (not both)
- Consistent padding (`p-4` or `p-6`)
- Clear content hierarchy
- Proper spacing between elements

### Cards (Bad)
- Border AND heavy shadow together
- Inconsistent internal padding
- No visual hierarchy
- Cramped content

### Forms (Good)
- Visible labels above inputs
- Clear error states with `--error` color
- Consistent spacing between fields (`gap-4` or `gap-6`)
- Helpful placeholder text
- Adequate input height (40-48px)

### Forms (Bad)
- Placeholder-only labels
- No error indication
- Random spacing between fields
- Tiny inputs

---

## Anti-Patterns (Never Do These)

1. **Rainbow gradients** - No multi-color gradients anywhere
2. **Tiny text** - Nothing below 12px; body text minimum 16px
3. **Inconsistent spacing** - Always use 8px grid
4. **Color chaos** - Stick to the palette; don't invent new colors
5. **Heavy shadows** - Shadows should be barely noticeable
6. **Missing states** - Every interactive element needs hover/focus/disabled
7. **Border + shadow combos** - Choose one, not both
8. **Generic icons** - Use consistent icon set throughout
9. **Centered everything** - Left-align most text content
10. **Decorative elements** - No purely decorative gradients, patterns, or shapes

---

## Quick Checklist

Before shipping any UI component, verify:

- [ ] Colors are from globals.css variables
- [ ] Spacing follows 8px grid
- [ ] Text is at least 16px for body content
- [ ] Interactive elements have hover/focus/disabled states
- [ ] Shadows are subtle (using design system shadows)
- [ ] No gradients
- [ ] Border radius is consistent
- [ ] Works in both dark and light mode
- [ ] Touch targets are at least 40px

---

## Tailwind Class Reference

### Backgrounds
- `bg-background`, `bg-elevated`, `bg-card`, `bg-sidebar`, `bg-hover`
- `bg-primary`, `bg-secondary`, `bg-accent`

### Text
- `text-foreground`, `text-muted`, `text-foreground-disabled`
- `text-primary-foreground`, `text-secondary-foreground`

### Borders
- `border-border`, `border-border-subtle`, `border-border-strong`
- `border-primary`, `border-error`

### Focus/Ring
- `ring-ring`, `focus:ring-2`, `focus:ring-offset-2`

### Status
- `text-success`, `text-warning`, `text-error`, `text-info`
- `bg-success`, `bg-warning`, `bg-error`, `bg-info`
