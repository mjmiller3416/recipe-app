---

## Summary of Changes

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
**Why these changes matter:**
1. **Component consistency**: Using `<Button variant="ghost">` ensures the minimized state button inherits all the design system's interaction states (hover, focus-visible rings, disabled states) automatically
2. **Reduced maintenance**: No need to manually keep hover/active styles in syncΓÇöthe Button component handles this
3. **Accessibility**: The Button component has proper focus management built-in with `focus-visible:ring` states
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

### Changes Made:

| Line | Before | After |
|------|--------|-------|
| 4 | Missing import | Added `Button` import from `@/components/ui/button` |
| 154-183 | Raw `<motion.button>` with manual interaction classes | Wrapped with `<motion.div>` for animation, using `<Button variant="ghost">` inside |

### Removed Redundant Classes:
- `hover:bg-accent/50` - Button's ghost variant has this built-in
- `active:scale-95` - Not needed, Button handles active states
- `transition-all duration-150` - Button has its own transitions
- `transition-colors` on the Sparkles icon - Button's group hover handles this naturally

The animation logic (rotate on sparkles icon) is preserved by keeping the `<motion.div>` wrapper around the animated content inside the Button.
