---

## Summary of Changes

| Before | After | Rule |
|--------|-------|------|
| `<Card>` with manual dashed border, hover, focus styles | `<Button variant="dashed">` | A2, A5 |
| `h-6 w-6` on icon | `size-6` | B4 (icon sizing convention) |
| Manual `cursor-pointer`, `role="button"`, `tabIndex={0}` | Button handles these natively | A5 |
| Nested div with duplicate hover states | Removed - Button handles text styling | A5 |
| `text-sm font-medium` on span | Removed - Button applies these via CVA | A4 |

---

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
**Why Button over Card here:**
1. The `dashed` variant in your Button component (line 24-25 of button.tsx) was designed specifically for "add new" placeholder actions
2. Using `<Card role="button">` is a semantic anti-pattern - if it behaves like a button, it should BE a button
3. The Button's dashed variant already includes the exact border styling (`border border-dashed border-primary/40`), hover effects, and focus rings - all compliant with your design system
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

**Lines changed:** 29-41 (reduced from 27 lines to 12 lines - a 55% reduction)

**Imports updated:** Replaced `Card` with `Button`
