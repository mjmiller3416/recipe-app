# Design System Rules - Single Source of Truth

This document defines ALL design system rules for the Recipe App. Both `/audit` (base components) and `/fix` (feature components) reference these rules.

---

## Part A: Component Usage Rules (Feature Components)

These rules apply to files in `app/`, `components/` (excluding `ui/`), and any file that USES base components.

### A1. No Fake Cards
- **Pattern:** `<div className="bg-card border border-border rounded-xl...">` or `bg-elevated`
- **Fix:** Replace with `<Card>`. Use `<CardHeader/Content/Footer>` only if semantic structure needed; otherwise `<Card className="p-4 flex...">` is fine.
- **Import:** `import { Card } from "@/components/ui/card"`

### A2. No Raw Buttons
- **Pattern:** Raw `<button>` tags, especially with icons or `p-1`/`p-1.5`
- **Fix:** Replace with `<Button variant="ghost" size="icon">` for icon buttons, or appropriate variant
- **Note:** For interactive pills/toggles, use `<Button shape="pill" variant={active ? 'default' : 'outline'}>`
- **Import:** `import { Button } from "@/components/ui/button"`

### A3. No Raw Badges/Status Labels
- **Pattern:** `<span>` or `<div>` used for status labels, counts, or pills with background colors
- **Fix:** Use `<Badge variant="...">`
- **Import:** `import { Badge } from "@/components/ui/badge"`

### A4. No Manual Sizing Overrides on Components
- **Pattern:** `h-9`, `h-[38px]`, `py-1`, `text-xs` on form elements (Input, Button, Select)
- **Fix:** REMOVE these classes. Use the component's built-in `size` prop (`size="sm"` or `size="lg"`)
- **Exception:** `size="sm"` is allowed ONLY for dense data tables

### A5. No Redundant Interaction Classes on Components
- **Pattern:** Manual `hover:`, `active:scale`, `transition` on base components that already have them
- **Fix:** REMOVE them. Base components handle their own interaction physics.

### A6. Token Standardization
- **Pattern:** Hardcoded colors (`text-gray-500`, `bg-purple-500`) or arbitrary values (`w-[250px]`, `h-[38px]`)
- **Fix:**
  - Colors → semantic tokens (`text-muted-foreground`, `bg-primary`)
  - Sizes → standard Tailwind (`w-64`, `h-10`) or component size props

---

## Part B: Component Definition Rules (Base UI Components)

These rules apply to files in `components/ui/` that DEFINE base components using `cva`.

### B1. Interactable Sizing (Height Scale)
| Size | Class | Pixels | Use Case |
|------|-------|--------|----------|
| sm | `h-8` | 32px | Dense tables only |
| default | `h-10` | 40px | Standard forms |
| lg | `h-12` | 48px | Hero CTAs |

- Icon-only buttons must be square: `h-10 w-10` (default), `h-8 w-8` (sm), `h-12 w-12` (lg)

### B2. Typography
- Interactive text (buttons, inputs, tabs): `text-sm` (14px)
- Font weight: `font-medium` (500)
- NEVER use arbitrary values like `text-[13px]`

### B3. Borders & Radius
- Border colors: `border-input` or `border-border` (NOT `border-gray-200`)
- Radius: `rounded-lg` or `rounded-md` (use `var(--radius)` from globals)
- Focus rings: `ring-ring` with `ring-offset-background`

### B4. Icons (Lucide)
- Default size inside components: `size-4` (16px)
- Stroke width: `strokeWidth={1.5}` (not default 2)
- NEVER hardcode SVGs - always import from `lucide-react`

### B5. Colors & Variants
- NO raw hex codes or unmapped Tailwind colors
- Use semantic tokens from `globals.css`: `bg-primary`, `text-muted-foreground`, etc.

### B6. Interaction States (CRITICAL)
Every interactive element MUST have ALL of these:
- **Hover:** `hover:bg-accent` or `hover:opacity-90`
- **Active/Press:** `active:scale-[0.98]` or `active:translate-y-px`
- **Focus:** `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Disabled:** `disabled:opacity-50 disabled:pointer-events-none`
- **Transitions:** `transition-all duration-150` or `duration-200` (never instant)

---

## Quick Reference: Which Rules Apply?

| File Location | Apply Part A | Apply Part B |
|---------------|--------------|--------------|
| `components/ui/*.tsx` | ❌ | ✅ |
| `components/**/*.tsx` (not ui) | ✅ | ❌ |
| `app/**/*.tsx` | ✅ | ❌ |

---

## Common Violations Cheatsheet

| Violation | Bad | Good |
|-----------|-----|------|
| Fake button | `<button className="p-1.5 rounded-md...">` | `<Button variant="ghost" size="icon">` |
| Fake badge | `<span className="px-2.5 py-1 rounded-lg bg-primary/20">` | `<Badge variant="secondary">` |
| Fake card | `<div className="bg-card border rounded-xl p-4">` | `<Card className="p-4">` |
| Raw color | `text-gray-500` | `text-muted-foreground` |
| Arbitrary size | `h-[38px]` | `h-10` (or use size prop) |
| Redundant transition | `<Button className="transition-all hover:opacity-90">` | `<Button>` (built-in) |