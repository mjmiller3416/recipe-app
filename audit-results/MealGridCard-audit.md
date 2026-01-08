`bg-overlay` is used in the dialog component, so `bg-overlay-strong` should work with Tailwind's theme integration. The fix is valid.

---

## Summary of Changes

| Change | Before | After |
|--------|--------|-------|
| **Import** | Missing `Button` import | Added `Button` import |
| **Shopping Cart Toggle** | Raw `<button>` with manual styles | `<Button variant="ghost" size="icon-sm">` |
| **Hover/Focus/Transition** | Manual `hover:bg-black/80 transition-colors focus-visible:...` | Removed (built into Button) |
| **Background Color** | Hardcoded `bg-black/60` | Semantic token `bg-overlay-strong` |
| **Icon Sizing** | `h-3.5 w-3.5` | `size-3.5` (cleaner shorthand) |
| **Favorite Indicator** | `w-6 h-6` | `size-6` (cleaner shorthand) |

---

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
- **Why `variant="ghost"`?** Ghost buttons have transparent backgrounds by default but gain a subtle hover state - perfect for icon buttons that need to overlay content
- **Why keep `bg-overlay-strong` override?** The design requires a semi-transparent dark background for visibility on images. This overrides ghost's default transparent bg while still using a design token
- **Why not use Badge for favorite?** The favorite indicator is decorative (not clickable or semantic status) - keeping it as a styled div is appropriate here. Badge would be overkill for a pure visual indicator.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
