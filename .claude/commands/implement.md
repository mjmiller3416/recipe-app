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

**The Golden Rule:** Never write raw HTML/CSS for a UI element if a Base UI component exists for it.

**Audit Checklist (Fix these specific patterns):**

1.  **Button & Icon Cleanup (Priority: High)**
    * **Target:** `IngredientRow.tsx`, `ShoppingItem.tsx`
    * **Pattern:** `<button className="p-1 text-muted-foreground...">`
    * **Fix:** Replace with `<Button variant="ghost" size="icon" shape="default">`.
    * **Constraint:** Ensure `size="icon"` (h-10 w-10) or `"icon-sm"` (h-8 w-8) is used to maintain touch targets.

2.  **"Fake Card" Elimination**
    * **Target:** `ShoppingListView.tsx` (StatCard), `MealQueueWidget.tsx`
    * **Pattern:** `<div className="bg-card border border-border rounded-xl...">`
    * **Fix:** Replace wrapper with `<Card>`. Use `<CardHeader/Content/Footer>` only if semantic structure is needed; otherwise, `<Card className="p-4 flex...">` is acceptable.

3.  **Pill & Badge Standardization**
    * **Target:** `RecipeCard.tsx` (RecipeBadge), `FilterPillGroup.tsx`
    * **Rule:**
        * **Read-Only Labels:** Must use `<Badge variant="...">`. (e.g. "Gluten Free").
        * **Interactive Toggles:** Must use `<Button shape="pill" variant={active ? 'default' : 'outline'}>`.
    * **Fix:** Replace manual `span` or `div` badges with the library components.

4.  **Form Input Alignment**
    * **Target:** `ShoppingListView.tsx` (AddManualItemForm)
    * **Pattern:** Inputs with manual height overrides (e.g., `h-9` or `h-12`).
    * **Fix:** Remove height classes. Rely on the default `h-10` defined in `input.tsx` and `button.tsx`.
    * **Exception:** If it is a "Hero" search bar (RecipeBrowser), `h-12` is allowed via the `size="lg"` prop, NOT manual CSS.

5.  **Typography & Colors**
    * **Pattern:** `text-gray-500`, `bg-purple-600`.
    * **Fix:** Convert to semantic tokens: `text-muted-foreground`, `bg-primary`.

6.  **Strip Redundant Interaction Props (The "Clean-Up"):**
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

7.  **Hardcoded Values Check:**
    * Flag any use of arbitrary values: `w-[250px]`, `px-[15px]`, `text-[#333]`.
    * *Action:* Snap them to the nearest Tailwind token (e.g., `w-64`, `px-4`, `text-neutral`).

**Deliverables:**
1.  **The "Rogue List":** A bulleted list of where the code bypassed the design system (e.g., "Line 45: Manually styled button found instead of `<Button variant='dashed'>`").
2.  **Refactored Code:** The complete file rewritten to fully leverage the imported UI components, removing all manual style redundancies.