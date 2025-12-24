# Enable SideDishSlots Empty State Click Functionality

## Problem
Empty SideDishSlots are currently disabled. When clicked, they should open the EditMealDialog and auto-select that specific slot.

## Analysis
The codebase already has the infrastructure in place:
- `SideDishSlots` component accepts `onEmptySlotClick` callback (when provided, enables empty slots)
- `MealSelection` accepts `onEmptySideSlotClick` and passes it to `SideDishSlots`
- `EditMealDialog` uses `activeSlotIndex` to track which slot is selected

## Plan

- [ ] 1. Add `initialSlotIndex` prop to `EditMealDialog` to allow pre-selecting a slot when opening
- [ ] 2. In `MealPlannerPage`, add state to track the initial slot index for the edit dialog
- [ ] 3. In `MealPlannerPage`, pass `onEmptySideSlotClick` handler to `MealSelection` that:
   - Sets the initial slot index (side slot index + 1, since 0 = main dish)
   - Opens the edit dialog

## Slot Index Mapping
- `EditMealDialog` slot indices: 0 = main dish, 1/2/3 = side dishes
- `SideDishSlots` empty click passes: 0/1/2 (position in side array)
- So: `editSlotIndex = sideSlotClickIndex + 1`

## Review
(To be filled after implementation)
