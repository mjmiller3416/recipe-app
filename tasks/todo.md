# Enable SideDishSlots Empty State Click Functionality

## Problem
Empty SideDishSlots are currently disabled. When clicked, they should open the EditMealDialog and auto-select that specific slot.

## Analysis
The codebase already has the infrastructure in place:
- `SideDishSlots` component accepts `onEmptySlotClick` callback (when provided, enables empty slots)
- `MealSelection` accepts `onEmptySideSlotClick` and passes it to `SideDishSlots`
- `EditMealDialog` uses `activeSlotIndex` to track which slot is selected

## Plan

- [x] 1. Add `initialSlotIndex` prop to `EditMealDialog` to allow pre-selecting a slot when opening
- [x] 2. In `MealPlannerPage`, add state to track the initial slot index for the edit dialog
- [x] 3. In `MealPlannerPage`, pass `onEmptySideSlotClick` handler to `MealSelection` that:
   - Sets the initial slot index (side slot index + 1, since 0 = main dish)
   - Opens the edit dialog

## Slot Index Mapping
- `EditMealDialog` slot indices: 0 = main dish, 1/2/3 = side dishes
- `SideDishSlots` empty click passes: 0/1/2 (position in side array)
- So: `editSlotIndex = sideSlotClickIndex + 1`

## Review

### Summary
Enabled the empty SideDishSlots to be clickable. When clicked, they now open the EditMealDialog with the corresponding slot pre-selected.

### Files Changed
1. **EditMealDialog.tsx** - Added `initialSlotIndex` prop that overrides the auto-select first empty slot behavior
2. **MealPlannerPage.tsx** - Added `editInitialSlotIndex` state and `handleEmptySideSlotClick` handler, wired props to child components

### How It Works
- Empty side dish slots now have hover/click interactions (already supported by SideDishSlots)
- Clicking an empty slot calls `handleEmptySideSlotClick(index)` where index is 0/1/2
- Handler converts to edit dialog slot index (adding 1, since 0=main in edit dialog)
- EditMealDialog opens and uses `initialSlotIndex` to pre-select the clicked slot
