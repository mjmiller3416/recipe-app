# Recap: Sticky ImageUploadCard Issue

**Goal:** Keep the ImageUploadCard fixed in the viewport while scrolling on the AddEditRecipe page.

**Problem:** When opening a Radix Select dropdown, the sticky element snaps back to its original position at the top of its container.

## Approaches Tried

| # | Approach | File Modified | What We Did | Result |
|---|----------|---------------|-------------|--------|
| 1 | Basic sticky positioning | AddEditRecipeView.tsx | Added `md:sticky md:top-[97px]` to inner div, removed `md:self-stretch` from outer div | ❌ Sticky didn't work - element scrolled out of view |
| 2 | Add self-stretch back | AddEditRecipeView.tsx | Restored `md:self-stretch` on outer div so sticky has room to work | ✅ Sticky works, but... |
| 3 | Add z-index | AddEditRecipeView.tsx | Added `z-10` to sticky element | ❌ Still snaps when Select opens |
| 4 | GPU compositing layer | AddEditRecipeView.tsx | Added `style={{ transform: 'translateZ(0)' }}` to force GPU layer | ❌ Still snaps when Select opens |
| 5 | Fixed positioning | AddEditRecipeView.tsx | Changed to `md:fixed` with calculated right position | ❌ Wrong position, doesn't scale across screen sizes |
| 6 | Disable modal on Select | select.tsx | Tried adding `modal={false}` to Select Root | ❌ TypeScript error - prop doesn't exist on Radix Select |
| 7 | Isolate form container | AddEditRecipeView.tsx | Added `isolate` class to form cards container | ❌ Still snaps when Select opens |