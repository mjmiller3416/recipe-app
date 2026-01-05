---
description: Audit a feature component for design system usage and refactor rogue implementations
argument-hint: <component-file>
---

You are a Senior Frontend Architect performing a "Design System Usage Audit" on a complex feature component.

**Target File to Audit:**
@$ARGUMENTS

**Reference Files (Design System):**
@frontend/src/app/globals.css
@frontend/src/components/ui/button.tsx
@frontend/src/components/ui/card.tsx
@frontend/src/components/ui/badge.tsx
@frontend/src/components/ui/input.tsx

**Context:**
1. We have a strict set of Base UI Components (referenced above: Button, Card, Badge, Input).
2. We have a `globals.css` file defining strict tokens for colors, spacing, and typography.
3. The target file contains "Legacy" or "Manual" implementations that need to be refactored to use the Design System.

**Audit Goals (The "Red Flags" to Hunt):**

1.  **Detect "Rogue" HTML Elements:**
    * Find any raw `<button>`, `<input>`, or `<div>` that is styling itself to look like a base component.
    * *Action:* Replace them with the imported UI component (e.g., replace `<button className="rounded bg-primary..."` with `<Button />`).

2.  **Strip Redundant Interaction Props (The "Clean-Up"):**
    * **Audit Principle:** Base components (Button, Card, Input) ALREADY handle `hover:`, `active:`, `focus:`, and `transition` states internally.
    * **The Violation:** Finding these classes on component instances:
        * `hover:bg-...`
        * `active:scale-...`
        * `focus:ring-...`
        * `transition-...`
        * `duration-...`
    * **Action:** REMOVE these classes entirely. Trust the component's internal variant to handle the state.
    * *Example:*
        * ❌ `<Button className="bg-primary hover:bg-primary/90 transition-all">`
        * ✅ `<Button>` (The `default` variant already handles the background and hover).

3.  **Standardize Typography:**
    * Identify any raw `<h1>`, `<h2>`, `<p>` tags with manual Tailwind classes (e.g., `text-2xl font-bold`).
    * *Action:* Replace manual classes with your semantic utility classes from `globals.css` (e.g., `text-page-title`, `text-section-header`, `text-body`).

4.  **Hardcoded Values Check:**
    * Flag any use of arbitrary values: `w-[250px]`, `px-[15px]`, `text-[#333]`.
    * *Action:* Snap them to the nearest Tailwind token (e.g., `w-64`, `px-4`, `text-neutral`).

**Deliverables:**
1.  **The "Rogue List":** A bulleted list of where the code bypassed the design system (e.g., "Line 45: Manually styled button found instead of `<Button variant='dashed'>`").
2.  **Refactored Code:** The complete file rewritten to fully leverage the imported UI components, removing all manual style redundancies.