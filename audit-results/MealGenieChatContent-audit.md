Good, `Button` is already imported. The fixes are complete.

---

## Summary of Changes

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
**Design System Compliance Fixes Applied:**

1. **Raw `<button>` ΓåÆ `<Button>` component** (line 110-117)
   - Replaced native button with the design system `Button` component using `variant="ghost"`
   - Added `aria-label="Expand Meal Genie"` for accessibility (Rule G2 - icon buttons need aria-label)
   - Removed redundant `hover:bg-accent/50 transition-colors` classes since `ghost` variant handles hover states internally

2. **Raw `<motion.button>` ΓåÆ `<motion.div>` + `<Button>`** (lines 252-276)
   - Separated animation concerns (Framer Motion on wrapper `div`) from component concerns (`Button`)
   - Used `variant="outline"` which provides built-in hover states, transitions, and proper theming
   - Removed 6 redundant CSS classes: `bg-card/50 border border-border/50 hover:border-border hover:bg-card hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150`
   - Kept `group` class for child hover coordination
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

**Rules Applied:**
- **A2**: No raw buttons ΓåÆ Use `<Button variant="..." size="...">`
- **A5**: No redundant interaction classes on components that already have them
- **G2**: Icon-only buttons need `aria-label`
- **E1**: CSS transitions for hover states handled by components; Framer Motion for enter/exit animations
