---
description: Audit a feature component for design system usage and refactor rogue implementations
argument-hint: <component-file>
---

You are a Senior Frontend Architect performing a "Design System Usage Audit" on a feature component.

**Target File:** @$ARGUMENTS

**Reference Files:**
@frontend/src/app/globals.css
@frontend/src/components/ui/button.tsx
@frontend/src/components/ui/card.tsx
@frontend/src/components/ui/badge.tsx
@frontend/src/components/ui/input.tsx

**Context:**
We strictly use Base UI components with `globals.css` tokens. Legacy code often uses manual HTML/CSS that must be replaced.

**The Golden Rule:** Never write raw HTML/CSS for a UI element if a Base UI component exists for it.

**Audit Checklist (Strict Enforcement):**

1.  **Fake Card Elimination**
    * **Pattern:** `<div className="bg-card border border-border rounded-xl...">` (or `bg-elevated`).
    * **Fix:** Replace wrapper with `<Card>`. Use `<CardHeader/Content/Footer>` only if semantic structure is needed; otherwise, `<Card className="p-4 flex...">` is acceptable.

2.  **Button & Icon Cleanup**
    * **Pattern:** Raw `<button>` tags, especially those with icons (`p-1`).
    * **Fix:** Replace with `<Button variant="ghost" size="icon">`.
    * **Note:** For interactive pills/toggles, use `<Button shape="pill" variant={active ? 'default' : 'outline'}>`.

3.  **Strict Sizing (Kill the "Micro-Inputs")**
    * **Pattern:** Manual sizing overrides like `h-9`, `h-[38px]`, `py-1`, or `text-xs` on form elements.
    * **Fix:** REMOVE these classes. Rely on the default `h-10` (40px) defined in `input.tsx` and `button.tsx`.
    * **Exception:** Explicit `size="sm"` is allowed ONLY for dense data tables.

4.  **Interaction Clean-Up (Physics)**
    * **Pattern:** Manual `hover:`, `active:scale`, or `transition` props on Base Components.
    * **Fix:** REMOVE them. The component variants already handle interaction physics.

5.  **Token Standardization**
    * **Pattern:** Hardcoded colors (`text-gray-500`) or arbitrary values (`w-[250px]`).
    * **Fix:** Snap to semantic tokens (`text-muted-foreground`) and standard spacing (`w-64`).

6.  **Read-Only Badges**
    * **Pattern:** `<span>` or `<div>` used for status labels.
    * **Fix:** Use `<Badge variant="...">`.

**Deliverables:**
1.  **The Rogue List:** Bullet points of specific violations found.
2.  **Apply Fixes:** Use the Edit tool to directly apply all fixes to the target file. Do NOT just output the code - actually edit the file.
3.  **Summary:** Brief summary of changes made.