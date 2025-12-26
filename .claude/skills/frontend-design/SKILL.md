---
name: frontend-design
description: Design system and frontend rules for the Recipe App (Next.js 15 + Tailwind + Shadcn).
---

# Recipe App Frontend Design Skill

## Purpose
This skill acts as the "Senior Frontend Designer" for the Recipe App. It enforces a strict alignment policy, ensures dark/light mode consistency, and maintains a "fun but functional" aesthetic.

## 1. Tech Stack (Strict)
* **Framework:** Next.js 15 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS v3.4+
* **UI Library:** Shadcn/UI (Radix Primitives)
    * **Rule:** All base UI components MUST use Shadcn/UI — never build from scratch
    * Use the `shadcn` MCP server to search/install components: `mcp__shadcn__search_items_in_registries`
* **Icons:** Lucide React (Use `stroke-width={1.5}` for elegance, `2` for active states)
* **Motion:** Framer Motion (for "fun & engaging" micro-interactions)

## 2. Design System Tokens

> **Rule:** Always use CSS variables — never hardcode color values.

See [tokens.md](tokens.md) for the complete token reference with values, Tailwind classes, and usage examples.

### Quick Reference
| Purpose | Token | Tailwind |
|---------|-------|----------|
| Primary (Purple) | `--primary` | `bg-primary`, `text-primary` |
| Secondary (Teal) | `--secondary` | `bg-secondary`, `text-secondary` |
| Page background | `--background` | `bg-background` |
| Card surface | `--card` | `bg-card` |
| Primary text | `--foreground` | `text-foreground` |
| Secondary text | `--muted` | `text-muted` |
| Borders | `--border` | `border-border` |
| Destructive | `--destructive` | `bg-destructive`, `text-destructive` |

### Typography & Shape
* **Font:** `Geist Sans` / `Geist Mono`
* **Radius:** Cards `rounded-xl`, Buttons `rounded-md`, Badges `rounded-full`

## 3. The "Alignment & Uniformity" Mandate (Critical)
The user hates misalignment. Follow these rules strictly:
1.  **Vertical Rhythm:** Use standard Tailwind spacing scales (`gap-2`, `gap-4`, `py-6`). Never use arbitrary values like `mt-[3px]`.
2.  **Icon + Text:** ALWAYS align icons with text visually.
    * *Bad:* `<div><Icon /> Text</div>`
    * *Good:* `<div className="flex items-center gap-2"><Icon className="h-4 w-4" /> <span>Text</span></div>`
3.  **Grid Consistency:** When displaying recipe cards, use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` with `gap-6` to ensure cards are equal width.
4.  **Touch Targets:** Ensure clickable elements are at least 44px height (`h-11`) on mobile for "fun & engaging" tactility.

## 4. "Fun & Engaging" Vibe Guidelines
To make the app feel alive without breaking utility:
* **Hover States:** Every interactive element must have a hover state.
    * *Tailwind:* `hover:bg-primary/90`, `transition-colors`, `active:scale-95`
    * *Custom CSS:* Use `var(--primary-hover)` for explicit hover color control.
* **Empty States:** Never leave a blank page. Use a Lucide icon + friendly text (e.g., "No recipes found yet! Time to cook something up?").
* **Images:** Use `aspect-square` or `aspect-video` consistently. Always add `overflow-hidden` to image containers so zoom effects on hover don't spill out.

## 5. Workflow for Generating Components
When asked to create or fix a UI component:

1.  **Check Shadcn First:** Before building anything, search the Shadcn registry for an existing component.
    * Use `mcp__shadcn__search_items_in_registries` to find components
    * Use `mcp__shadcn__get_item_examples_from_registries` to see usage patterns
    * Install with `npx shadcn@latest add <component>`
2.  **Choose the Right Variant:** See [component-usage.md](component-usage.md) for decision trees on:
    * Button variants (primary vs secondary vs destructive vs ghost)
    * Badge variants (when to use which color)
    * Card patterns (which surface + radius to use)
    * Icon sizing rules
    * Color application guidelines
3.  **Check Context:** Is this a Page (`page.tsx`) or a Component (`/components/ui` or `/_components`)?
4.  **Scaffold:** Extend Shadcn components using the pattern (`forwardRef`, `cn()` utility).
5.  **Choose the Right Surface:**
    * `bg-background` — Page-level backgrounds
    * `bg-card` or `bg-elevated` — Raised cards and panels
    * `bg-popover` — Dropdowns, tooltips, menus
    * `bg-sidebar` — Sidebar areas
6.  **Apply Dark/Light Mode:**
    * Use `text-foreground` for primary text, `text-muted` for secondary.
    * *Check:* Will this border be visible in Light Mode? (Use `border-border` or `border-input`).
7.  **Recipe Badges:** Use the utility classes for consistency:
    * `.recipe-category-badge` — Purple (primary)
    * `.recipe-meal-type-badge` — Teal (secondary)
    * `.recipe-dietary-badge` — Gray (accent)
8.  **Align & Polish:**
    * Verify `flex` alignments.
    * Add `transition-all duration-200` to interactive elements.
9.  **Self-Correction Question:** "Are the icons aligned with the text? Is the spacing uniform? Does it look good in Light Mode?"

## 6. Auditing Existing Pages for Consistency
When asked to review or revise an existing page:

### Quick Audit Checklist
1. **Surface Colors:** Are all backgrounds using the correct token?
   * Page background → `bg-background`
   * Cards/panels → `bg-card` or `bg-elevated`
   * Inputs → `bg-input`
2. **Typography:** Is text using the hierarchy?
   * Primary text → `text-foreground`
   * Secondary text → `text-muted`
   * Disabled → `text-foreground-disabled`
3. **Spacing:** Are margins/padding from the standard scale?
   * Look for arbitrary values like `mt-[13px]` → fix to `mt-3`
   * Verify consistent `gap-*` usage in flex/grid layouts
4. **Components:** Are base UI elements Shadcn/UI?
   * Buttons, inputs, cards, dialogs, etc. should come from `/components/ui`
   * No custom implementations of standard components
5. **Borders:** Consistent border tokens?
   * `border-border` for standard, `border-subtle` for light, `border-strong` for emphasis
6. **Hover/Active States:** Every interactive element should have feedback
   * Buttons, cards, list items need hover states

### Common Inconsistencies to Fix
* **Mixed button styles** — All primary actions use `variant="default"`, secondary use `variant="outline"`
* **Inconsistent card padding** — Standardize on `p-4` or `p-6`
* **Random icon sizes** — Use `h-4 w-4` (small), `h-5 w-5` (default), `h-6 w-6` (large)
* **Mismatched border radius** — Cards use `rounded-lg`, buttons use `rounded-md`

### Page-Level Consistency Rules
* All pages should have the same page header pattern (if applicable)
* Empty states should follow the same Lucide icon + friendly text pattern
* Loading states should use the same Skeleton patterns
* Error states should use consistent destructive styling

## 7. Anti-Patterns (Do Not Do)
* **No Arbitrary Margins:** Avoid `m-1.5` unless absolutely necessary for visual balance. Stick to 1, 2, 4, 6, 8.
* **No "Wall of Text":** Always break recipe instructions with spacing or bullet points.
* **No Clashing Gradients:** Stick to solid Purple/Teal identity unless specifically asked for a gradient.
* **No Hardcoded Colors:** Always use CSS variables (`--primary`, `--foreground`, etc.) — never raw hex/hsl values.

## 8. Theme Mode
* **Dark mode is the DEFAULT** — defined in `:root`
* **Light mode is opt-in** — activated via `:root.light` class on `<html>`
* All CSS variables automatically adapt between modes — no conditional styling needed
* Test both modes when creating new components