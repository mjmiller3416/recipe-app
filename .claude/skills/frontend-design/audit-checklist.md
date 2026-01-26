# Design System Audit Checklist

> Use this checklist to verify a component meets all design system requirements.

## Quick Scan (Critical Violations)

Run through these first - any "No" is a blocker:

| Check | Pass? |
|-------|-------|
| No raw `<div>` styled as cards? Use `<Card>` | ☐ |
| No raw `<button>` elements? Use `<Button>` | ☐ |
| No raw `<span>` badges? Use `<Badge>` | ☐ |
| No hardcoded colors (gray-500, purple-500)? | ☐ |
| No arbitrary values (h-[38px], w-[250px])? | ☐ |
| All icon buttons have `aria-label`? | ☐ |
| No redundant `hover:`, `transition` on components? | ☐ |

---

## Detailed Checklist

### A. Component Usage

#### A1. Cards
- [ ] Using `<Card>` component, not `<div className="bg-card border...">`
- [ ] `<CardHeader>`, `<CardContent>`, `<CardFooter>` only when semantic structure needed
- [ ] Otherwise `<Card className="p-4">` is acceptable

#### A2. Buttons
- [ ] Using `<Button>` component with appropriate `variant`
- [ ] Icon-only buttons use `size="icon"` + `aria-label`
- [ ] No manual sizing classes (`h-9`, `py-1`) - use `size` prop
- [ ] Loading state shows spinner + `disabled` attribute

#### A3. Badges
- [ ] Using `<Badge>` component, not styled `<span>`
- [ ] Appropriate variant selected
- [ ] Recipe badges use dedicated tokens (`bg-recipe-category-bg`, etc.)

#### A4. Form Elements
- [ ] Using `<Input>`, `<Select>`, `<Textarea>` from ui/
- [ ] Each input has associated `<Label>`
- [ ] Required fields marked with `<span className="text-destructive">*</span>`
- [ ] Error messages use `text-sm text-destructive`
- [ ] Helper text uses `text-sm text-muted-foreground`

#### A5. Icons
- [ ] All icons from `lucide-react`
- [ ] Using `strokeWidth={1.5}` (not default 2)
- [ ] Size: `size-4` (16px) inline, `size-5` or `size-6` standalone
- [ ] Decorative icons have `aria-hidden="true"`

---

### B. Color Tokens

#### B1. Text Colors
- [ ] Primary text: `text-foreground`
- [ ] Secondary text: `text-muted-foreground`
- [ ] Accent text: `text-primary`
- [ ] Error text: `text-destructive`
- [ ] **No** `text-gray-*`, `text-zinc-*`, etc.

#### B2. Background Colors
- [ ] Page: `bg-background`
- [ ] Cards/elevated: `bg-card` or `bg-elevated`
- [ ] Muted surfaces: `bg-muted`
- [ ] Hover states: `bg-accent` or `bg-hover`
- [ ] **No** `bg-gray-*`, `bg-slate-*`, etc.

#### B3. Borders
- [ ] Container borders: `border-border`
- [ ] Input borders: `border-input`
- [ ] Error borders: `border-destructive`
- [ ] Focus rings: `ring-ring`
- [ ] **No** `border-gray-*`, etc.

---

### C. Spacing & Layout

#### C1. Spacing
- [ ] Using Tailwind scale: `gap-2`, `gap-4`, `p-4`, `space-y-4`
- [ ] **No** arbitrary spacing: `gap-[15px]`, `p-[18px]`
- [ ] Consistent spacing within component (no mixed `mb-3`, `mb-4`, `mb-5`)

#### C2. Sizing
- [ ] Using Tailwind scale: `h-10`, `w-64`
- [ ] **No** arbitrary sizes: `h-[38px]`, `w-[250px]`
- [ ] Component sizing via props (`size="sm"`) not classes

#### C3. Layout
- [ ] Icon + text: `flex items-center gap-2`
- [ ] Form fields: `space-y-4` between fields
- [ ] Label + input: `space-y-2`
- [ ] Card padding: `p-4` (content) or `p-6` (spacious)

---

### D. Interaction States

#### D1. Hover States
- [ ] Interactive elements have visible hover state
- [ ] Not duplicating hover on components that have built-in hover

#### D2. Focus States
- [ ] Using `focus-visible:` not `focus:`
- [ ] Focus ring visible and uses `ring-ring`

#### D3. Disabled States
- [ ] Disabled elements have reduced opacity
- [ ] `disabled` attribute present on form elements
- [ ] No interaction on disabled elements

#### D4. Loading States
- [ ] Buttons show `<Loader2 className="animate-spin" />`
- [ ] Button is `disabled` while loading
- [ ] Text changes to indicate action ("Saving...", "Loading...")

---

### E. Accessibility

#### E1. Labels
- [ ] All form inputs have visible `<Label>`
- [ ] Labels use `htmlFor` pointing to input `id`

#### E2. ARIA
- [ ] Icon-only buttons have `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Live regions use `aria-live="polite"` for updates

#### E3. Keyboard
- [ ] All interactive elements keyboard accessible
- [ ] Focus order follows visual order
- [ ] No keyboard traps

---

### F. Motion (if applicable)

#### F1. Transitions
- [ ] Using `duration-150` to `duration-300`
- [ ] Using `ease-out` or custom easing
- [ ] **No** `duration-1000` or longer

#### F2. Animations
- [ ] Respects `prefers-reduced-motion`
- [ ] Subtle and purposeful
- [ ] Using pre-defined animation classes when possible

---

## Common Violation Patterns

### Find & Replace

| Search for | Replace with |
|------------|--------------|
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| `text-gray-600` | `text-foreground-subtle` |
| `text-gray-900` | `text-foreground` |
| `bg-gray-100` | `bg-muted` |
| `bg-gray-800` | `bg-card` |
| `bg-gray-900` | `bg-background` |
| `border-gray-200` | `border-border` |
| `border-gray-700` | `border-border` |
| `rounded-lg shadow` (on div) | `<Card>` component |
| `<button className="` | `<Button variant="` |
| `<span className="px-2 py-1 rounded` | `<Badge>` |

### Regex Patterns

```regex
# Find arbitrary pixel values
h-\[\d+px\]|w-\[\d+px\]|p-\[\d+px\]|m-\[\d+px\]|gap-\[\d+px\]

# Find hardcoded gray colors
(text|bg|border)-(gray|slate|zinc|neutral|stone)-\d+

# Find raw button elements
<button\s+className=

# Find icon buttons without aria-label
size="icon"(?!.*aria-label)
```

---

## Report Template

Use this format when reporting audit results:

```markdown
## Audit Report: [ComponentName]

**File:** `path/to/component.tsx`
**Type:** [Page | Feature Component | UI Component]
**Verdict:** [PASS | NEEDS FIXES]

### Violations Found

| Line | Violation | Fix |
|------|-----------|-----|
| 15 | `text-gray-500` | `text-muted-foreground` |
| 23 | `<button>` without Button | `<Button variant="ghost" size="icon">` |
| 45 | Missing aria-label on icon button | Add `aria-label="Close"` |

### Recommendations

- [Optional suggestions for improvement]

### Corrected Code

\`\`\`tsx
// Show corrected code snippets
\`\`\`
```

---

## Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| 🔴 Critical | Accessibility or semantic violation | Must fix |
| 🟠 Warning | Token/component violation | Should fix |
| 🟡 Info | Style consistency | Consider fixing |
