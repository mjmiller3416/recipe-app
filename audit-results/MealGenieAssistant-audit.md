The Button import is already present at line 9.

---

## Summary of Changes

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
**Design System Compliance Fixes:**
1. **Raw buttons ΓåÆ Button component**: The suggestion buttons were using `<motion.button>` with manually recreated hover/transition states. This violates Rule A2 (no raw buttons) and A5 (no redundant interaction classes). The Button component already has all these states built-in via CVA variants.

2. **Preserved animation with wrapper**: By wrapping `<Button>` in `<motion.div>`, we keep the staggered entrance animation while using the proper component for interaction.

3. **Simplified Input focus**: Removed custom focus ring overrides (`focus-visible:ring-amber-500/30`) since the Input component already has consistent focus states defined in its CVA variants. Custom brand colors for focus states fragment the design system.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

### Changes Made:
| Location | Before | After |
|----------|--------|-------|
| Lines 197-222 | `<motion.button>` with 8+ manual styling classes | `<motion.div>` wrapper + `<Button variant="outline">` |
| Lines 230-237 | `<Input>` with custom focus ring overrides | `<Input>` using built-in focus states |

### What Was Kept:
- The amber/orange gradient on the send button - this is intentional brand theming for Meal Genie
- The `aria-label` on the icon button (correct accessibility pattern)
- All Framer Motion animations (these are appropriate for enter/exit per Rule E1)
