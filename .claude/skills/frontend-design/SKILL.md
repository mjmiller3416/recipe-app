---
name: frontend-design
description: Apply when building or auditing UI. Enforces design tokens, Shadcn-first patterns, alignment rules, and the "fun but functional" aesthetic for Recipe App components.
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

For the complete token reference including values, Tailwind classes, and usage examples, see [tokens.md](tokens.md).

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

## 5. Motion & Animation Guidelines

> **Rule:** Use animation tokens for consistent timing. Never use arbitrary durations.

### Duration Tokens
| Token | Value | Use Case |
|-------|-------|----------|
| `--duration-instant` | 100ms | Button press, toggle |
| `--duration-fast` | 150ms | Hover states, micro-feedback |
| `--duration-normal` | 300ms | Page transitions, modals |
| `--duration-slow` | 500ms | Complex animations, emphasis |

### Easing Tokens
| Token | Use Case |
|-------|----------|
| `--ease-default` | General purpose, smooth deceleration |
| `--ease-in` | Exit animations |
| `--ease-out` | Enter animations |
| `--ease-bounce` | Playful interactions, confirmations |

### Standard Patterns
| Element | Animation | Implementation |
|---------|-----------|----------------|
| Button hover | Color shift | `transition-colors duration-150` |
| Button press | Scale down | `active:scale-95 transition-transform duration-100` |
| Card hover | Subtle lift | `hover:shadow-lg transition-shadow duration-200` |
| Modal enter | Fade + scale | `animate-scale-in` (custom class) |
| Page transition | Fade in | `animate-fade-in` (custom class) |
| Loading spinner | Continuous | `animate-spin` (Tailwind built-in) |

### Custom Animation Classes
These utility classes are defined in `globals.css`:
* `.animate-fade-in` / `.animate-fade-out`
* `.animate-slide-up` / `.animate-slide-down`
* `.animate-scale-in`

### Framer Motion Conventions
For complex animations, use Framer Motion with these defaults:
* `duration: 0.3` (matches `--duration-normal`)
* `ease: [0.4, 0, 0.2, 1]` (matches `--ease-default`)
* Use `AnimatePresence` for exit animations
* Prefer `motion.div` with `initial`, `animate`, `exit` props

## 6. Workflow for Generating Components
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

## 7. Auditing Existing Pages

When reviewing or revising an existing page, follow the comprehensive checklist in [audit-checklist.md](audit-checklist.md).

## 8. Anti-Patterns

See the Anti-Patterns section in [component-usage.md](component-usage.md) for common mistakes to avoid.

## 9. Theme Mode
* **Dark mode is the DEFAULT** — defined in `:root`
* **Light mode is opt-in** — activated via `:root.light` class on `<html>`
* All CSS variables automatically adapt between modes — no conditional styling needed
* Test both modes when creating new components