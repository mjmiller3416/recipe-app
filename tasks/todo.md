# Bug Fix & UX Improvement: Meal Creation Flow

## Problem 1 (Bug)
When selecting a main dish from the RecipePickerDialog, the MealPreviewDialog doesn't appear because it's only rendered inside the `if (showRecipePicker)` conditional block.

## Problem 2 (UX Improvement)
User requested showing the MealPreviewDialog first when clicking "Add Meal" to provide better context.

## Changes Made

### 1. Fixed dialog rendering condition
**File:** `MealPlannerView.tsx:416`
```javascript
// Changed from:
if (showRecipePicker) {
// To:
if (showRecipePicker || showMealPreview) {
```

### 2. Changed "Add Meal" to open preview dialog first
**File:** `MealPlannerView.tsx`
- `handleAddMealClick()` and `handleCreateMealClick()` now open `showMealPreview` instead of `showRecipePicker`
- Added new `handleSelectMainFromPreview()` handler to open recipe picker from preview dialog
- Updated `handlePickerClose()` to always return to preview dialog

### 3. Made empty main dish slot clickable
**File:** `MealPreviewPanel.tsx`
- Added `onSelectMain` prop
- Converted empty main dish div to clickable button with hover state

### 4. Passed prop through MealPreviewDialog
**File:** `MealPreviewDialog.tsx`
- Added `onSelectMain` prop and passed to MealPreviewPanel

## New Flow
1. Click "Add Meal" → MealPreviewDialog opens (empty)
2. Click empty main dish slot → RecipePickerDialog opens
3. Select main dish → Returns to MealPreviewDialog with selection
4. Optionally add sides
5. Click "Add to Meal Queue" → Meal created

## Tasks
- [x] Fix condition in MealPlannerView.tsx line 416
- [x] Update handleAddMealClick to open preview first
- [x] Add handleSelectMainFromPreview handler
- [x] Add onSelectMain prop to MealPreviewPanel
- [x] Make empty main dish slot clickable
- [x] Add onSelectMain prop to MealPreviewDialog
- [x] Update handlePickerClose to return to preview
