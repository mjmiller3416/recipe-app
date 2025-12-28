# Component Usage Decision Trees

This reference provides decision trees for choosing the correct component variants, colors, and patterns. Use these when creating or auditing UI components.

---

## Button Variants

### Decision Tree

```
Is this the ONLY action in the current context?
  └─ Yes → variant="default" (Primary)

Is this one of multiple actions?
  ├─ Is it the main/recommended path? → variant="default" (Primary)
  ├─ Is it an alternative option? → variant="secondary" or variant="outline"
  ├─ Is it destructive (delete, remove, clear)? → variant="destructive"
  └─ Is it low-emphasis (cancel, dismiss, close)? → variant="ghost"

Is it styled like a link but needs button behavior?
  └─ Yes → variant="link"
```

### Quick Reference

| Scenario | Variant | Example Context |
|----------|---------|-----------------|
| Main CTA, single action | `default` | Save, Submit, Confirm |
| Main CTA among multiple | `default` | Primary action in a button group |
| Alternative action | `secondary` | Secondary action alongside primary |
| Bordered, subtle action | `outline` | Filter toggles, optional actions |
| Destructive action | `destructive` | Delete, Remove, Clear all |
| Minimal/dismiss action | `ghost` | Cancel, Close, "X" buttons |
| Text-link behavior | `link` | "Learn more", inline actions |

### Rules
- Only ONE `default` (primary) button per logical section
- Destructive actions should have confirmation dialogs
- Ghost buttons pair well with primary buttons (e.g., "Save" + "Cancel")

### Weight Utilities for Buttons

For enhanced tactile feedback, add weight utilities to buttons:

| Utility | Effect | When to Use |
|---------|--------|-------------|
| `button-weighted` | Raised shadow, lift on hover, inset on press | Primary CTAs needing extra presence |
| `button-bouncy` | Spring effect, scale on hover/press | Playful, fun CTAs |

**Decision Tree:**
```
Does this button need extra visual presence?
  └─ No → Use standard Shadcn button (sufficient for most cases)
  └─ Yes → Is the context playful/fun?
      ├─ Yes → Add `button-bouncy`
      └─ No → Add `button-weighted`
```

**Examples:**
```tsx
// Standard button (most cases)
<Button>Save Recipe</Button>

// Weighted for emphasis
<Button className="button-weighted">Generate Recipe</Button>

// Bouncy for fun
<Button className="button-bouncy">Let's Cook!</Button>
```

---

## Badge Variants

### Decision Tree

```
What type of information does the badge convey?

Category/classification information?
  └─ Yes → variant="default" (Primary purple)

Time-based or meal-related?
  └─ Yes → variant="secondary" (Teal)

Dietary/attribute information?
  └─ Yes → variant="outline" or use accent color

Status indicator (new, featured, sale)?
  └─ Yes → variant="default" (Primary purple)

Numeric count or quantity?
  └─ Yes → variant="outline"

Neutral/informational tag?
  └─ Yes → variant="outline"
```

### Quick Reference

| Content Type | Variant/Style | Color Token |
|--------------|---------------|-------------|
| Category (cuisine, type) | `default` | `--primary` (purple) |
| Meal type (breakfast, dinner) | `secondary` | `--secondary` (teal) |
| Dietary (vegan, gluten-free) | `outline` or custom | `--accent` |
| Status (new, featured) | `default` | `--primary` |
| Count/quantity | `outline` | `--foreground` |
| Neutral tag | `outline` | `--muted` |

### Recipe-Specific Classes
For recipe cards, use the predefined utility classes:
- `.recipe-category-badge` → Purple (primary)
- `.recipe-meal-type-badge` → Teal (secondary)
- `.recipe-dietary-badge` → Gray (accent)

---

## Color Application

### When to Use Primary (Purple `--primary`)

```
Use Primary when:
  ├─ Main call-to-action buttons
  ├─ Active/selected tab or navigation item
  ├─ Category badges and classifications
  ├─ Focus rings (already default via --ring)
  ├─ Progress indicators (active step)
  └─ Key data highlights in charts
```

### When to Use Secondary (Teal `--secondary`)

```
Use Secondary when:
  ├─ Secondary action buttons
  ├─ Meal type badges (breakfast, lunch, dinner)
  ├─ Alternative highlights (when purple is already used)
  ├─ Success-adjacent states (completed, done)
  └─ Secondary data series in charts
```

### When to Use Destructive (Red `--destructive`)

```
Use Destructive when:
  ├─ Delete/remove actions
  ├─ Error messages and states
  ├─ Form validation errors
  ├─ Warning badges (use sparingly)
  └─ Favorite/heart icons (special case - uses --recipe-favorite)
```

### When to Use Neutral Colors

```
Use Muted (--muted, --muted-foreground) when:
  ├─ Secondary/helper text
  ├─ Placeholder text
  ├─ Disabled states (with --foreground-disabled)
  ├─ Subtle borders
  └─ Background metadata

Use Accent (--accent) when:
  ├─ Hover states on neutral surfaces
  ├─ Dietary/attribute badges
  └─ Subtle highlighting
```

---

## Card Patterns

### Decision Tree

```
What is the card's purpose?

Displaying a recipe/content item?
  └─ bg-card + rounded-xl + overflow-hidden + shadow-sm

Settings or form panel?
  └─ bg-card + rounded-lg + p-6 + border-border

Modal/dialog content?
  └─ bg-popover + rounded-lg + p-6

Dropdown/menu content?
  └─ bg-popover + rounded-md + shadow-md

Sidebar section?
  └─ bg-sidebar + rounded-none (flush with sidebar)

Elevated/floating element?
  └─ bg-elevated + rounded-lg + shadow-lg
```

### Quick Reference

| Use Case | Background | Border Radius | Extras |
|----------|------------|---------------|--------|
| Recipe card | `bg-card` | `rounded-xl` | `overflow-hidden`, `shadow-sm` |
| Settings panel | `bg-card` | `rounded-lg` | `p-6`, `border` |
| Dialog | `bg-popover` | `rounded-lg` | `p-6` |
| Dropdown menu | `bg-popover` | `rounded-md` | `shadow-md` |
| Sidebar section | `bg-sidebar` | `rounded-none` | — |
| Tooltip | `bg-popover` | `rounded-md` | `shadow-sm`, `text-sm` |

### Card Padding Standards
- Compact cards: `p-3` or `p-4`
- Standard cards: `p-4` or `p-6`
- Spacious panels: `p-6` or `p-8`

**Rule:** Pick ONE padding value per card type and use it consistently across the app.

### Surface Classes for Cards

Use surface classes for consistent depth hierarchy (combines bg, border, and shadow):

| Class | When to Use |
|-------|-------------|
| `surface-base` | Page-level containers, static sections |
| `surface-raised` | Standard content cards, panels |
| `surface-elevated` | Emphasized panels, selected items |
| `surface-floating` | Dropdowns, tooltips, modals |

**Example:**
```tsx
// Standard card using surface class
<div className="surface-raised rounded-xl p-4">
  Card content
</div>

// Modal using floating surface
<Dialog>
  <DialogContent className="surface-floating">
    Modal content
  </DialogContent>
</Dialog>
```

### Interactive Utilities for Cards

Add tactile feedback to clickable cards:

| Utility | When to Use |
|---------|-------------|
| `interactive` | Primary content cards (recipe cards, list items) |
| `liftable` | Cards that feel "pickable" but simpler feedback |
| `interactive-subtle` | Small cards, compact list items |
| `bouncy` | Playful/fun contexts |

**Decision Tree:**
```
Is this card clickable?
  └─ No → Don't add interactive utilities
  └─ Yes → What size/importance?
      ├─ Primary content card (recipe, product) → `interactive`
      ├─ Medium card, needs lift effect → `liftable`
      ├─ Small card, list item → `interactive-subtle`
      └─ Fun/playful context → `bouncy`
```

**Example:**
```tsx
// Interactive recipe card
<div className="bg-card rounded-xl overflow-hidden interactive">
  <img src={recipe.image} className="aspect-video" />
  <div className="p-4">
    <h3>{recipe.title}</h3>
  </div>
</div>

// Subtle list item card
<div className="bg-card rounded-lg p-3 interactive-subtle">
  <span>{item.name}</span>
</div>
```

---

## Icon Sizing

### Decision Tree

```
Where is the icon placed?

Inside a button WITH text?
  └─ h-4 w-4 (16px)

Inside an icon-only button?
  ├─ size="sm" button → h-4 w-4
  ├─ size="default" button → h-5 w-5
  └─ size="lg" button → h-5 w-5 or h-6 w-6

In a list item or menu?
  └─ h-4 w-4 (16px)

In navigation (sidebar, header)?
  └─ h-5 w-5 (20px)

As page decoration (empty state, hero)?
  └─ h-12 w-12 to h-16 w-16 (48-64px)

In a badge or tag?
  └─ h-3 w-3 (12px)
```

### Quick Reference

| Context | Size Class | Pixels |
|---------|------------|--------|
| Button with text | `h-4 w-4` | 16px |
| Icon-only button (default) | `h-5 w-5` | 20px |
| List items, menus | `h-4 w-4` | 16px |
| Navigation | `h-5 w-5` | 20px |
| Badge/tag inline | `h-3 w-3` | 12px |
| Empty state decoration | `h-12 w-12` | 48px |
| Hero/page illustration | `h-16 w-16` | 64px |

### Icon Styling
- Default: `stroke-width={1.5}` for elegance
- Active/emphasized: `stroke-width={2}`
- Always wrap with flex alignment: `flex items-center gap-2`

---

## Input & Form Elements

### Decision Tree

```
What type of input?

Single-line text?
  └─ <Input /> from shadcn/ui

Multi-line text?
  └─ <Textarea /> from shadcn/ui

Selection from options?
  ├─ Few options (2-5) visible at once → Radio group or Segmented control
  ├─ Many options, single select → <Select /> dropdown
  └─ Many options, multi-select → <Command /> with checkboxes or <MultiSelect />

Boolean toggle?
  ├─ Settings/preferences → <Switch />
  └─ Form agreement/consent → <Checkbox />

Search with suggestions?
  └─ <Command /> (combobox pattern)
```

### Form Layout Rules
- Label above input (not inline) for consistency
- Error messages below input in `text-destructive`
- Helper text in `text-muted` below label or input
- Required fields: Add `*` to label, not placeholder

---

## Spacing Quick Reference

### Standard Scale (use these, not arbitrary values)

| Token | Tailwind | Use Case |
|-------|----------|----------|
| 4px | `gap-1`, `p-1` | Tight spacing (badge padding) |
| 8px | `gap-2`, `p-2` | Compact spacing (button padding) |
| 12px | `gap-3`, `p-3` | Small cards, list items |
| 16px | `gap-4`, `p-4` | Standard card padding |
| 24px | `gap-6`, `p-6` | Spacious sections |
| 32px | `gap-8`, `p-8` | Page sections |
| 48px | `gap-12`, `py-12` | Major section breaks |

### Rules
- **Never** use arbitrary values like `mt-[13px]`
- Icon + text gap: always `gap-2`
- Card grid gap: always `gap-4` or `gap-6`
- Section spacing: `py-6` to `py-12`

---

## Loading States (Skeleton)

Use Shadcn's `<Skeleton />` component for loading placeholders.

### Decision Tree

```
Is the content loading from an async source?
  ├─ Full page loading? → Use full-page Skeleton layout
  ├─ List of items loading? → Use repeated Skeleton rows
  ├─ Single card loading? → Use card-shaped Skeleton
  └─ Image loading? → Use Skeleton with aspect ratio matching image

Is it a quick operation (<300ms expected)?
  └─ Consider no skeleton, just show content when ready
```

### Skeleton Sizing Patterns

| Content Type | Skeleton Pattern |
|--------------|------------------|
| Recipe card image | `<Skeleton className="h-48 w-full rounded-xl" />` |
| Title text | `<Skeleton className="h-6 w-3/4" />` |
| Body text line | `<Skeleton className="h-4 w-full" />` |
| Avatar/icon | `<Skeleton className="h-10 w-10 rounded-full" />` |
| Badge | `<Skeleton className="h-5 w-16 rounded-full" />` |
| Button | `<Skeleton className="h-10 w-24 rounded-md" />` |

### Example: Recipe Card Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton"

function RecipeCardSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}
```

### Rules
- Match skeleton dimensions to actual content dimensions
- Use `rounded-*` matching the actual element's border radius
- Group skeletons with `space-y-*` matching actual content spacing
- Use `animate-pulse` (default) — don't change the animation

---

## Scrollbar Utilities

Custom scrollbar utilities for cleaner scroll experiences.

### Decision Tree

```
Does the scrollable area need a visible scrollbar?
  └─ No → Use `scrollbar-hidden` (maintains scroll, hides bar)
  └─ Yes → Is layout shift a concern?
      ├─ Yes → Use `scrollbar-overlay` (no layout space)
      └─ No → Use default scrollbar (styled via globals.css)
```

### Quick Reference

| Utility | Effect | Use Case |
|---------|--------|----------|
| `scrollbar-hidden` | Hide scrollbar, keep scroll | Horizontal carousels, modals with inner scroll |
| `scrollbar-overlay` | Overlay scrollbar (no layout shift) | Sidebars, long lists where content matters |

### Examples

```tsx
// Hidden scrollbar for carousel
<div className="flex overflow-x-auto scrollbar-hidden gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// Overlay scrollbar for sidebar
<aside className="h-screen overflow-y-auto scrollbar-overlay">
  <nav>{/* Navigation items */}</nav>
</aside>
```

---

## Anti-Patterns (Do Not Do)

These are common mistakes to avoid. If you see these patterns, fix them.

### Spacing Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| `m-1.5`, `p-2.5`, `gap-1.5` | Use standard scale: `m-1`, `m-2`, `p-2`, `p-3`, `gap-1`, `gap-2` |
| `mt-[13px]`, `py-[7px]` | Use standard Tailwind: `mt-3`, `py-2` |
| Inconsistent padding on similar cards | Pick ONE padding value per card type |

### Color Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| `text-gray-500`, `bg-purple-600` | Use tokens: `text-muted`, `bg-primary` |
| `#8b5cf6`, `hsl(271, 91%, 65%)` | Use CSS vars: `var(--primary)` |
| Clashing gradients | Stick to solid Purple/Teal identity |

### Typography Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| "Wall of text" without breaks | Use spacing, bullets, paragraphs |
| Random font sizes | Use Tailwind scale: `text-sm`, `text-base`, `text-lg` |
| Inconsistent heading hierarchy | Follow H1 > H2 > H3 order |

### Component Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Build custom button from scratch | Use `<Button />` from Shadcn |
| Multiple primary buttons in one section | Only ONE `variant="default"` per logical section |
| Skip hover states | Every interactive element needs feedback |
| Misaligned icon + text | Always use `flex items-center gap-2` |

### Layout Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Leave blank/empty pages | Use empty state with icon + friendly text |
| Inconsistent card grid gaps | Use `gap-4` or `gap-6` consistently |
| Mixed border radius styles | Cards: `rounded-xl`, Buttons: `rounded-md`, Badges: `rounded-full` |
