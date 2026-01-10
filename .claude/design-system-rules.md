# Design System Rules - Single Source of Truth

> **CRITICAL RULES — CHECK EVERY PR**
> 
> 1. **No fake cards** → Use `<Card>`, not `<div className="bg-card border rounded-xl">`
> 2. **No raw buttons** → Use `<Button variant="ghost" size="icon">`, not `<button className="p-1.5">`
> 3. **No raw badges** → Use `<Badge>`, not styled `<span>` elements
> 4. **No hardcoded colors** → Use `text-muted-foreground`, not `text-gray-500`
> 5. **No arbitrary values** → Use `h-10`, not `h-[38px]`
> 6. **No redundant states** → Don't add `hover:`, `transition` to components that have them built-in
> 7. **Icon buttons need aria-label** → `<Button size="icon" aria-label="Close">`
> 8. **Use spacing scale** → `space-y-4` or `gap-4`, not mixed `mb-3`/`mb-4`/`mb-5`
> 9. **Use z-index scale** → `z-50` for modals, not `z-[999]`
> 10. **Loading states required** → Buttons show spinner + disabled state during async actions
>
> *Full rules below. Ctrl+F for detailed patterns.*

---

## Quick Reference: Which Rules Apply?

| File Location | Parts A, C, D, E | Part B |
|---------------|------------------|--------|
| `components/ui/*.tsx` | ❌ | ✅ |
| `components/**/*.tsx` (not ui) | ✅ | ❌ |
| `app/**/*.tsx` | ✅ | ❌ |

- **Part A:** Component usage (feature code)
- **Part B:** Component definitions (base UI)
- **Part C:** Layout & spacing (all files)
- **Part D:** States & feedback (all files)
- **Part E:** Motion & animation (all files)

---

## Part A: Component Usage Rules

These rules apply to files that USE base components (`app/`, `components/` excluding `ui/`).

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
- **Allowed contexts for `size="sm"`:** Dense data tables, compact toolbars, filter bars, inline actions

### A5. No Redundant Interaction Classes on Components
- **Pattern:** Manual `hover:`, `active:scale`, `transition` on base components that already have them
- **Fix:** REMOVE them. Base components handle their own interaction states.

### A6. Token Standardization
- **Pattern:** Hardcoded colors (`text-gray-500`, `bg-purple-500`) or arbitrary values (`w-[250px]`, `h-[38px]`)
- **Fix:**
  - Colors → semantic tokens (see Part F)
  - Sizes → standard Tailwind scale (`w-64`, `h-10`) or component size props
- **Reference:** See Part F for complete token list

### A7. Form Field Patterns
- **Labels:** Always above input, using `<Label>` component
- **Helper text:** Below input, `text-sm text-muted-foreground`
- **Error messages:** Below input, `text-sm text-destructive`
- **Required fields:** Add `<span className="text-destructive">*</span>` after label text
- **Field spacing:** `space-y-2` between label and input, `space-y-4` between fields

```tsx
// Correct form field structure

  Recipe Name *
  
  Enter a descriptive name

```

### A8. Icon + Input Combinations
- **Pattern:** Input with leading/trailing icons
- **Fix:** Use wrapper div with relative positioning

```tsx
// Correct icon + input pattern

```

---

## Part B: Component Definition Rules

These rules apply to files in `components/ui/` that DEFINE base components using `cva`.

### B1. Interactable Sizing (Height Scale)

| Size | Class | Pixels | Use Case |
|------|-------|--------|----------|
| sm | `h-8` | 32px | Dense tables, compact toolbars, inline actions |
| default | `h-10` | 40px | Standard forms, primary actions |
| lg | `h-12` | 48px | Hero CTAs, mobile touch targets |

- Icon-only buttons must be square: `h-10 w-10` (default), `h-8 w-8` (sm), `h-12 w-12` (lg)

### B2. Typography
- Interactive text (buttons, inputs, tabs): `text-sm` (14px)
- Font weight for interactive elements: `font-medium` (500)
- NEVER use arbitrary values like `text-[13px]`

### B3. Borders & Radius
- Border colors: `border-input` (form elements) or `border-border` (containers)
- Radius scale:
  - `rounded-md` (6px): Buttons, inputs, small elements
  - `rounded-lg` (8px): Cards, dialogs, larger containers
  - `rounded-xl` (12px): Feature cards, hero elements
- Focus rings: `ring-ring` with `ring-offset-background`

### B4. Icons (Lucide)
- Default size inside components: `size-4` (16px)
- Stroke width: `strokeWidth={1.5}` (not default 2)
- NEVER hardcode SVGs - always import from `lucide-react`

### B5. Colors & Variants
- NO raw hex codes or unmapped Tailwind colors in component definitions
- Use semantic tokens from `globals.css` exclusively
- Reference Part F for complete token mapping

### B6. Interaction States (CRITICAL)

Every interactive element MUST have ALL of these:

| State | Required Classes | Notes |
|-------|------------------|-------|
| Hover | `hover:bg-accent` or `hover:opacity-90` | Visual feedback on pointer |
| Active/Press | `active:scale-[0.98]` | Physical "press" feedback |
| Focus | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` | Keyboard navigation |
| Disabled | `disabled:opacity-50 disabled:pointer-events-none` | Non-interactive state |
| Transitions | `transition-colors duration-150` | Smooth state changes |

---

## Part C: Layout & Spacing

These rules apply to ALL files.

### C1. Spacing Scale

Use consistent spacing from the Tailwind scale:

| Token | Pixels | Use Case |
|-------|--------|----------|
| `gap-1` / `space-x-1` | 4px | Icon + text inline |
| `gap-2` / `space-y-2` | 8px | Related elements (label + input) |
| `gap-3` | 12px | List items, compact groups |
| `gap-4` / `space-y-4` | 16px | Form fields, card sections |
| `gap-6` / `space-y-6` | 24px | Content sections |
| `gap-8` / `space-y-8` | 32px | Major page sections |

### C2. Container Padding

| Context | Padding | Class |
|---------|---------|-------|
| Card content | 16px | `p-4` |
| Card with header/footer | 24px horizontal, 16px vertical | `px-6 py-4` |
| Dialog content | 24px | `p-6` |
| Page sections | 24-32px | `p-6` or `p-8` |
| Compact/dense UI | 12px | `p-3` |

### C3. Dialog & Modal Conventions

| Property | Value | Class |
|----------|-------|-------|
| Width (sm) | 400px | `max-w-[400px]` |
| Width (default) | 500px | `max-w-[500px]` or `max-w-lg` |
| Width (lg) | 640px | `max-w-[640px]` or `max-w-xl` |
| Width (full) | 900px | `max-w-[900px]` or `max-w-4xl` |
| Overlay | Black 80% | `bg-black/80` |
| Content padding | 24px | `p-6` |
| Header/footer padding | 24px horizontal, 16px vertical | `px-6 py-4` |
| Border radius | 12px | `rounded-xl` |

### C4. Z-Index Scale

| Layer | Z-Index | Use Case |
|-------|---------|----------|
| Base | `z-0` | Default content |
| Dropdown | `z-10` | Menus, popovers |
| Sticky | `z-20` | Sticky headers, floating elements |
| Modal overlay | `z-40` | Dialog backdrops |
| Modal content | `z-50` | Dialog content |
| Toast | `z-[100]` | Notifications (always on top) |

### C5. Responsive Breakpoints

Mobile-first approach. Override at larger breakpoints:

| Breakpoint | Min Width | Common Use |
|------------|-----------|------------|
| (base) | 0px | Mobile defaults |
| `sm:` | 640px | Large phones, small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |

**Common patterns:**
```tsx
// Stack on mobile, row on desktop
className="flex flex-col md:flex-row"

// Full width on mobile, constrained on desktop
className="w-full md:w-auto"

// Hide on mobile, show on desktop
className="hidden md:block"

// Grid columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

---

## Part D: States & Feedback

### D1. Loading States

**Skeleton patterns:**
- Use `bg-muted animate-pulse rounded-md`
- Match dimensions of content being loaded
- Skeleton height for text: `h-4` (body), `h-6` (headings)

```tsx
// Skeleton card example

  
  
  

```

**Spinner usage:**
- Use `Loader2` from lucide-react with `animate-spin`
- Size: `size-4` inline, `size-6` or `size-8` for page/section loading
- Button loading: Replace icon or prepend spinner, add `disabled` state

```tsx

  
  Saving...

```

### D2. Empty States

Structure for empty states:
```tsx

  
    
  
  No recipes found
  
    Try adjusting your search or filters
  
  Add Recipe

```

### D3. Error States

- Error text: `text-sm text-destructive`
- Error borders: `border-destructive`
- Error backgrounds (subtle): `bg-destructive/10`

### D4. Success/Confirmation

- Success text: `text-sm text-emerald-500`
- Success backgrounds: `bg-emerald-500/10`
- Use toast notifications for transient success messages

---

## Part E: Motion & Animation

### E1. When to Use CSS Transitions vs Framer Motion

| Scenario | Use | Reason |
|----------|-----|--------|
| Hover/focus states | CSS `transition` | Built into components, performant |
| Color/opacity changes | CSS `transition` | Simple property interpolation |
| Enter/exit animations | Framer Motion | AnimatePresence handles unmount |
| Layout animations | Framer Motion | `layout` prop handles reflow |
| Gesture-based (drag, swipe) | Framer Motion | Physics-based, gesture support |
| Staggered children | Framer Motion | Orchestration control |
| Scroll-triggered | Framer Motion | `useInView`, `useScroll` |

### E2. Duration Scale

| Duration | Use Case | Class/Value |
|----------|----------|-------------|
| 100ms | Micro-interactions (opacity) | `duration-100` |
| 150ms | Button states, hover | `duration-150` |
| 200ms | Standard transitions | `duration-200` |
| 300ms | Expanding/collapsing | `duration-300` |
| 400-500ms | Page transitions, modals | Framer Motion |

### E3. Easing

- Default: `ease-out` for enters, `ease-in` for exits
- Spring (Framer): `type: "spring", stiffness: 400, damping: 30` for snappy
- Spring (Framer): `type: "spring", stiffness: 300, damping: 25` for smooth

### E4. Standard Animation Patterns

**Fade in:**
```tsx
// CSS
className="animate-in fade-in duration-200"

// Framer Motion
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.2 }}
```

**Slide up + fade (dialogs, dropdowns):**
```tsx
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 8 }}
transition={{ duration: 0.2 }}
```

**Scale (popovers, toasts):**
```tsx
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.95 }}
```

### E5. Reduced Motion

Always respect user preferences:
```tsx
// Framer Motion
const prefersReducedMotion = useReducedMotion()

// CSS
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## Part F: Token Reference

### F1. Semantic Color Tokens

| Purpose | Token | Use Case |
|---------|-------|----------|
| Primary text | `text-foreground` | Headings, body text |
| Secondary text | `text-muted-foreground` | Descriptions, placeholders, helper text |
| Disabled text | `text-muted-foreground/50` | Disabled labels |
| Link/accent text | `text-primary` | Interactive text, links |
| Error text | `text-destructive` | Validation errors |
| Success text | `text-emerald-500` | Confirmation messages |

### F2. Background Tokens

| Purpose | Token | Use Case |
|---------|-------|----------|
| Page background | `bg-background` | Root/body |
| Elevated surface | `bg-card` | Cards, dialogs |
| Subtle surface | `bg-muted` | Secondary containers, skeletons |
| Hover state | `bg-accent` | Interactive element hover |
| Input background | `bg-background` or `bg-card` | Form inputs |
| Primary action | `bg-primary` | Primary buttons |
| Destructive action | `bg-destructive` | Delete buttons |

### F3. Border Tokens

| Purpose | Token | Use Case |
|---------|-------|----------|
| Default border | `border-border` | Cards, containers |
| Input border | `border-input` | Form elements |
| Focus ring | `ring-ring` | Focus states |
| Error border | `border-destructive` | Invalid inputs |

### F4. Glassmorphism

Apply glassmorphism consistently:

```tsx
// Standard glass effect
className="bg-card/80 backdrop-blur-xl border border-white/10"

// Subtle glass (lighter)
className="bg-card/60 backdrop-blur-lg border border-white/5"

// Heavy glass (more opaque)
className="bg-card/90 backdrop-blur-2xl border border-white/15"
```

**When to use:**
- Floating UI elements (popovers, dropdowns)
- Overlaid content (sidebars over content)
- Feature cards that need visual emphasis

**When NOT to use:**
- Primary content cards
- Form containers
- Dense data displays

---

## Part G: Accessibility

### G1. Focus Management

- All interactive elements must be keyboard accessible
- Focus order must follow visual order
- Use `focus-visible` (not `focus`) to avoid focus rings on click

### G2. Screen Reader Support

| Scenario | Solution |
|----------|----------|
| Icon-only buttons | `aria-label="Action name"` |
| Decorative icons | `aria-hidden="true"` |
| Status updates | `aria-live="polite"` on container |
| Required fields | `aria-required="true"` on input |
| Error messages | `aria-describedby` linking input to error |
| Hidden but readable | `className="sr-only"` |

### G3. Color Contrast

- Normal text: minimum 4.5:1 contrast ratio
- Large text (18px+ or 14px bold): minimum 3:1
- Interactive elements: minimum 3:1 against background

---

## Common Violations Cheatsheet

| Violation | Bad | Good |
|-----------|-----|------|
| Fake button | `<button className="p-1.5 rounded-md hover:bg-accent">` | `<Button variant="ghost" size="icon">` |
| Fake badge | `<span className="px-2.5 py-1 rounded-lg bg-primary/20">` | `<Badge variant="secondary">` |
| Fake card | `<div className="bg-card border rounded-xl p-4">` | `<Card className="p-4">` |
| Raw color | `text-gray-500` | `text-muted-foreground` |
| Arbitrary size | `h-[38px]` | `h-10` (or use size prop) |
| Redundant transition | `<Button className="transition-all hover:opacity-90">` | `<Button>` (built-in) |
| Missing aria-label | `<Button size="icon"><X /></Button>` | `<Button size="icon" aria-label="Close"><X /></Button>` |
| Inconsistent spacing | `mb-3`, `mb-4`, `mb-5` mixed | Pick one: `space-y-4` on parent |
| Hardcoded z-index | `z-[999]` | `z-50` (use scale) |
| Missing loading state | Button with no feedback | `<Button disabled><Loader2 className="animate-spin" />` |

---

## Changelog

- **v2.0** - Added Parts C (Layout), D (States), E (Motion), F (Tokens), G (Accessibility). Expanded form patterns, dialog conventions, glassmorphism rules. Added responsive and z-index scales.
- **v1.0** - Initial component usage and definition rules.