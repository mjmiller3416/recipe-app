---

## Summary of Changes

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
**Design System Token Usage**: The fixes replace ad-hoc color values like `bg-primary/10` with semantic tokens like `bg-primary-surface`. These semantic tokens are defined in `globals.css` and automatically adapt to light/dark mode while maintaining proper contrast ratios. This is critical for accessibility and theme consistency.

**Button Variant Selection**: When buttons need custom backgrounds, using `variant="ghost"` (which has minimal default styling) combined with surface tokens is cleaner than overriding `variant="secondary"` with custom colors. The `variant="default"` is the proper choice for primary actions like "Use This Image".
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

### Fixes Applied:

| Line | Before | After | Rule |
|------|--------|-------|------|
| 147 | `bg-primary/10` | `bg-primary-surface` | A6 - Token standardization |
| 161 | `bg-elevated` | `bg-muted` | A6 - Use proper semantic token |
| 165, 176 | `bg-primary/10` | `bg-primary-surface` | A6 - Token standardization |
| 246, 270, 330 | `bg-primary/10 ... hover:bg-primary/20` | `bg-primary-surface text-primary-on-surface` | A5, A6 - Remove redundant hover, use tokens |
| 286 | `variant="secondary"` + custom overrides | `variant="default"` | A5 - Use proper variant instead of overriding |
| 297 | `title="..."` | `aria-label="..."` | G2 - Icon buttons need aria-label |

The component now uses proper design system tokens (`bg-primary-surface`, `text-primary-on-surface`, `bg-muted`) instead of arbitrary opacity values, ensuring consistent theming across light and dark modes while removing redundant hover state overrides.
