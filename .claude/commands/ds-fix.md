---
description: Fix design system violations in a component
argument-hint: <component-file>
---

You are a Senior Frontend Architect performing a Design System Compliance Fix.

**Target File:** @$ARGUMENTS

**Rules Reference (Single Source of Truth):**
@.claude/design-system-rules.md

**Reference Components (understand the patterns):**
@frontend/src/components/ui/button.tsx
@frontend/src/components/ui/card.tsx
@frontend/src/components/ui/badge.tsx
@frontend/src/components/ui/input.tsx

**Design Tokens:**
@frontend/src/app/globals.css

---

## Instructions

1. **Detect file type:**
   - If target is in `components/ui/` → Apply **Part B** rules (component definitions)
   - Otherwise → Apply **Part A** rules (component usage)

2. **Scan for violations** against the applicable rules from `design-system-rules.md`

3. **Output the Rogue List:** Bullet points of violations with line numbers

4. **Apply Fixes:** Use the Edit tool to directly fix ALL violations. Do NOT just output code - actually edit the file.

5. **Summary:** Brief summary of changes made

---

## Critical Reminders

- Keep fixes minimal and surgical - don't refactor unrelated code
- Add necessary imports when replacing raw elements with components
- Remove redundant classes when switching to base components
- If a file has NO violations, say so and move on