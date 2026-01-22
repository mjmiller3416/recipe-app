# UX: Confirm Before Canceling Meal Creation

## Problem
Users can accidentally cancel meal creation by:
- Clicking outside the MealPreviewDialog
- Pressing Escape
- Clicking the back button on RecipePickerDialog
- Navigating via sidebar

## Solution
Add confirmation dialog when user tries to exit meal creation flow with a main dish selected.

## Tasks
- [x] Add `useUnsavedChanges` hook to MealPlannerView (handles browser nav + sidebar)
- [x] Add discard confirmation state and dialog
- [x] Intercept MealPreviewDialog close attempts
- [x] Intercept RecipePickerDialog back/escape (returns to preview dialog, which has confirmation)
- [x] Add AlertDialog UI for confirmation

## Files Changed
- `frontend/src/app/meal-planner/_components/MealPlannerView.tsx`

## Review
Added two confirmation dialogs:

1. **Discard Dialog** - Shows when user tries to close the MealPreviewDialog (click outside, press X, escape) while they have a main dish selected. Asks "Discard Meal?" with options to "Keep Editing" or "Discard".

2. **Leave Dialog** - Shows when user tries to navigate away via:
   - Browser back/forward buttons
   - Sidebar navigation (via SafeLink)
   - Browser refresh/close (native browser dialog)

The `useUnsavedChanges` hook tracks `isDirty: !!pendingMain` to know when meal creation is in progress. When confirmed, `resetMealCreation()` clears all pending state.

Note: RecipePickerDialog already returns to MealPreviewDialog on close, so confirmation happens there.
