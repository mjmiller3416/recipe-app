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
* **Icons:** Lucide React (Use `stroke-width={1.5}` for elegance, `2` for active states)
* **Motion:** Framer Motion (for "fun & engaging" micro-interactions)

## 2. Design System Tokens (Extracted from globals.css)

### Colors (HSL)
* **Primary:** `hsl(221.2 83.2% 53.3%)` (Bright Blue)
    * *Usage:* Primary buttons, active tabs, key focal points.
* **Background:**
    * *Light:* `hsl(0 0% 100%)` (Pure White) - **Warning:** Watch contrast on light mode borders.
    * *Dark:* `hsl(222.2 84% 4.9%)` (Deep Navy/Black)
* **Muted/Secondary:** `hsl(210 40% 96.1%)` (Light Gray/Blueish)
* **Destructive:** `hsl(0 84.2% 60.2%)` (Red)

### Typography & Shape
* **Font:** `Inter` (Variable).
* **Radius:** `0.5rem` (`rounded-lg`) is the default.
    * *Cards:* `rounded-lg` or `rounded-xl`.
    * *Buttons:* `rounded-md`.
    * *Badges/Pills:* `rounded-full`.

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
    * *Example:* `hover:bg-primary/90`, `transition-colors`, `active:scale-95`.
* **Empty States:** Never leave a blank page. Use a Lucide icon + friendly text (e.g., "No recipes found yet! Time to cook something up?").
* **Images:** Use `aspect-square` or `aspect-video` consistently. Always add `overflow-hidden` to image containers so zoom effects on hover don't spill out.

## 5. Workflow for Generating Components
When asked to create or fix a UI component:

1.  **Check Context:** Is this a Page (`page.tsx`) or a Component (`/components/ui` or `/_components`)?
2.  **Scaffold:** Use the Shadcn pattern (`forwardRef`, `cn()` utility).
3.  **Apply Dark/Light Mode:**
    * Use `bg-background` and `text-foreground` by default.
    * *Check:* Will this border be visible in Light Mode? (Use `border-border` or `border-input`).
4.  **Align & Polish:**
    * Verify `flex` alignments.
    * Add `transition-all duration-200` to interactive elements.
5.  **Self-Correction Question:** "Are the icons aligned with the text? Is the spacing uniform? Does it look good in Light Mode?"

## 6. Anti-Patterns (Do Not Do)
* **No Arbitrary Margins:** Avoid `m-1.5` unless absolutely necessary for visual balance. Stick to 1, 2, 4, 6, 8.
* **No "Wall of Text":** Always break recipe instructions with spacing or bullet points.
* **No Clashing Gradients:** Stick to the solid Primary Blue identity unless specifically asked for a gradient.