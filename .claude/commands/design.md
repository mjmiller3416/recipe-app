# Frontend Design Command

Create or modify a UI component following the Recipe App design system.

## Request

$ARGUMENTS

## Instructions

**You MUST use the `frontend-design` skill for this task.** Reference the skill files at `.claude/skills/frontend-design/` for:
- Design tokens and CSS variables ([tokens.md](.claude/skills/frontend-design/tokens.md))
- Component usage patterns ([component-usage.md](.claude/skills/frontend-design/component-usage.md))
- Audit checklist ([audit-checklist.md](.claude/skills/frontend-design/audit-checklist.md))

### Step 1: Understand the Request

Parse the user's request to determine:
- **Action:** Create new component, modify existing, or audit?
- **Component type:** Page, UI component, or feature component?
- **Location:** Where should this live in the codebase?

### Step 2: Check Shadcn Registry

Before building anything custom:
1. Search the Shadcn registry: `mcp__shadcn__search_items_in_registries`
2. Check for usage examples: `mcp__shadcn__get_item_examples_from_registries`
3. Install if available: `npx shadcn@latest add <component>`

### Step 3: Apply Design System

Follow these critical rules from the skill:

**Tokens (Never hardcode values):**
- Colors: Use `bg-background`, `text-foreground`, `bg-primary`, etc.
- Spacing: Use Tailwind scales (`gap-2`, `gap-4`, `py-6`)
- Radius: Cards `rounded-xl`, Buttons `rounded-md`, Badges `rounded-full`

**Alignment (Critical):**
- Icon + Text: Always use `flex items-center gap-2`
- Grid: Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Touch targets: Minimum `h-11` for clickable elements

**Interactivity:**
- Add hover states to all interactive elements
- Use weight utilities: `interactive`, `pressable`, `liftable`
- Use surface classes: `surface-raised`, `surface-elevated`, `surface-floating`

**Responsiveness:**
- Never use fixed pixel widths for layout
- Prefer aspect ratios, viewport units, or clamp()
- Use Tailwind presets (`w-20`, `h-24`) over arbitrary values

### Step 4: Implement

1. Create/modify the component following the design system
2. Use TypeScript with proper types
3. Extend Shadcn components using `forwardRef` and `cn()` utility
4. Test both dark and light modes mentally

### Step 5: Self-Audit

Before finishing, verify:
- [ ] Icons aligned with text?
- [ ] Spacing uniform throughout?
- [ ] Hover states on all interactive elements?
- [ ] No hardcoded colors or arbitrary pixel values?
- [ ] Works in both dark and light mode?

### Step 6: Report

Provide a summary:
```
✅ Component created/updated!

Location: [file path]
Type: [Page | UI Component | Feature Component]
Shadcn used: [components installed or "N/A"]

Key design decisions:
- [Decision 1]
- [Decision 2]
```

## Notes

- Keep changes minimal and focused
- When in doubt, reference the skill files directly
- Ask for clarification if the request is ambiguous