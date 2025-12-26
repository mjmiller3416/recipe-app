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
