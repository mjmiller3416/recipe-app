---

## Summary of Changes

| Line | Before | After | Rule |
|------|--------|-------|------|
| 69-82 | Card without `interactive` prop + manual `transition-all duration-200 ease-in-out` + manual focus-visible classes | Card with `interactive` prop, removed redundant transition and focus classes | A5 |
| 118-130 | Card without `interactive` prop + manual `transition-all duration-200 ease-in-out` + manual focus-visible classes | Card with `interactive` prop, removed redundant transition and focus classes | A5 |
| 146 | `opacity-0 group-hover:opacity-100 transition-opacity` | `opacity-0 group-hover:opacity-100` | A5 |

---

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
1. **Card's `interactive` prop** - The Card component has a built-in `interactive={true}` variant that automatically adds `cursor-pointer`, `hover:border-border-strong`, `hover:shadow-elevated`, focus ring styles, and `active:scale-[0.99]`. Using this prop instead of manually adding these classes ensures consistency and reduces code duplication.

2. **Button handles its own transitions** - The Button component (via `buttonVariants`) already includes `transition-all duration-150 ease-physical` for hover/active states. Adding `transition-opacity` was redundant since the ghost variant already smoothly transitions colors.

3. **Focus-visible is inherited** - When using the `interactive` prop on Card, focus-visible ring styles are automatically applied, eliminating the need for manual `focus-visible:outline-none focus-visible:ring-2...` classes.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
