## Summary of Changes

| Line | Before | After |
|------|--------|-------|
| 7 | (none) | Added `Button` import |
| 53-63 | Raw `<button>` with manual styles | `<Button variant="ghost" size="icon-sm">` |
| 90-110 | Raw `<button>` with `p-1.5 rounded-full` | `<Button variant="ghost" size="icon-sm" shape="pill">` |

**Changes Made:**

1. **Added Button import** from the UI components library

2. **Drag handle button** (lines 53-63):
   - Replaced raw `<button>` with `<Button variant="ghost" size="icon-sm">`
   - Removed redundant `transition-colors duration-150` (built into Button)
   - Removed `p-1` padding (handled by `size="icon-sm"` which gives `size-8`)
   - Kept cursor-grab styling and touch-none for DnD functionality

3. **Cooked toggle button** (lines 90-110):
   - Replaced raw `<button>` with `<Button variant="ghost" size="icon-sm" shape="pill">`
   - Removed redundant `p-1.5 rounded-full transition-colors interactive-subtle` (all handled by Button component)
   - `shape="pill"` provides the `rounded-full` appearance
   - Kept the conditional color classes for success state

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
- **Why `size="icon-sm"`?** The design system defines `icon-sm` as `size-8` (32px ├ù 32px), which is appropriate for inline actions in compact UIs like this queue item. The default `icon` size is `size-10` (40px), which would be too large for this dense layout.
- **Why keep some classes?** The `cursor-grab`/`active:cursor-grabbing` and `touch-none` classes are DnD-specific behaviors not handled by the Button component, so they must remain.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
