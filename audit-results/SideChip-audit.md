## Summary of Changes

| Line | Before | After | Rule |
|------|--------|-------|------|
| 6 | Import with stale comment | Clean import | Code hygiene |
| 48-52 | `bg-elevated hover:bg-hover` overrides | Removed - uses Button's built-in `outline` styling | A5: No redundant interaction classes |
| 50 | `mr-1` manual spacing | Removed - Button has built-in `gap-2` | A4: No manual sizing overrides |

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
- **Why remove `bg-elevated`?** The `outline` variant in `button.tsx:18` already has `bg-button-outline-bg` which provides the appropriate subtle background. Overriding it with `bg-elevated` breaks the design system's consistency.
- **Why remove `hover:bg-hover`?** The `outline` variant already includes `hover:bg-hover` in its definition, so adding it again is redundant and could cause specificity issues.
- **Built-in gap**: Button's base styles include `gap-2`, so emoji and text spacing is already handled without manual margins.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

The component now properly delegates all interaction states and styling to the base `Button` component while maintaining its semantic purpose as a side dish chip.
