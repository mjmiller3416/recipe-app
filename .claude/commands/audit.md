---
description: Audit a UI component for design system compliance
argument-hint: <component-file>
---

You are a Senior Design System Architect. Your goal is to audit the attached UI component to ensure it strictly adheres to the project's design system tokens and consistency rules.

**Reference Files:**
1. Use `globals.css` as the Source of Truth for all variables, colors, and animations.
2. The component file provided is the target to audit.

**Component to Audit:**
@$ARGUMENTS

**Also read the design tokens:**
@frontend/src/app/globals.css

**Strict Audit Rules:**
1.  **Interactable Sizing:**
    * Default height for Inputs, Buttons, and Select triggers MUST be `h-10` (40px).
    * Small variants should be `h-8` (32px).
    * Large variants should be `h-12` (48px).
    * Icon-only buttons must be square (e.g., `h-10 w-10`).

2.  **Typography:**
    * Interactive text (buttons, inputs, tabs) MUST be `text-sm` (14px).
    * Font weight for interactive elements MUST be `font-medium` (500).
    * NEVER use hardcoded arbitrary values (e.g., `text-[13px]`). Use standard Tailwind classes mapped in `globals.css`.

3.  **Borders & Radius:**
    * Borders must use semantic colors: `border-input` or `border-border`, NOT `border-gray-200`.
    * Radius must use `rounded-lg` (or `var(--radius)` equivalent).
    * Focus rings must use `ring-ring`.

4.  **Icons (Lucide-React):**
    * Default icon size inside components should be `size-4` (16px).
    * Icon stroke width should be `1.5` (not default 2) for a refined look.
    * Icons must not be hardcoded SVGs; import from `lucide-react`.

5.  **Colors & Variants:**
    * Do not use raw hex codes or unmapped tailwind colors (e.g., `bg-purple-500`).
    * Use semantic tokens defined in `globals.css` (e.g., `bg-primary`, `text-muted-foreground`).
    * Ensure "Ghost" and "Outline" styles align with the `Button.tsx` standard (transparent bg, specific hover states).

6.  **Interaction & State (CRITICAL):**
    * **Hover:** Every interactive element MUST have a defined `hover:` state (e.g., `hover:bg-accent` or `hover:opacity-90`).
    * **Active/Press:** Buttons must have an `active:` state (e.g., `active:scale-95` or `active:translate-y-px`) to provide tactile feedback.
    * **Focus:** All interactive elements must have a `focus-visible:` ring using the standard variables (`ring-ring`, `ring-offset-background`).
    * **Disabled:** Must include `disabled:opacity-50` and `disabled:pointer-events-none`.
    * **Transitions:** ALWAYS include `transition-all` and standard duration/easing (e.g., `duration-200 ease-in-out`)—never instant color changes.

**Task:**
1.  Analyze the provided component file.
2.  List every violation of the above rules (bullet points).
3.  Rewrite the component code (using `cva` and `cn`) to fix all violations.
4.  Ensure `cva` variants include the standard `default`, `sm`, and `lg` sizes defined in Rule #1.