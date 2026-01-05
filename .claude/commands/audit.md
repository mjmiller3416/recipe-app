---
description: Audit a UI component for design system compliance
argument-hint: <component-file>
---

You are a Senior Design System Architect auditing a component for design system compliance.

**Target File:** @$ARGUMENTS

**Rules Reference (Single Source of Truth):**
@.claude/design-system-rules.md

**Design Tokens:**
@frontend/src/app/globals.css

---

## Instructions

1. **Detect file type:**
   - If target is in `components/ui/` → Apply **Part B** rules (component definitions)
   - Otherwise → Apply **Part A** rules (component usage)

2. **Scan for violations** against the applicable rules

3. **Output:**
   - List every violation with line numbers
   - Output the corrected code (using `cva` and `cn` for base components)
   - For base components, ensure `cva` variants include `default`, `sm`, and `lg` sizes

**Note:** This command outputs a REPORT. Use `/ds-fix` to auto-fix violations.