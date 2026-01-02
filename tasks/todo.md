# Ask Meal Genie Component Structure Setup

## Overview
Create the structure for the Ask Meal Genie component following the existing widget patterns in the dashboard.

## Todo Items

- [x] Create `ask-meal-genie/` folder with widget structure
- [x] Update `DashboardView.tsx` to import new widget
- [x] Remove `AskMealGeniePlaceholder` from `PlaceholderWidgets.tsx`

## Review

### Files Created
**`ask-meal-genie/AskMealGenieWidget.tsx`**
- Main widget component with full structure
- State hooks: `input`, `messages`, `isLoading`
- `handleSubmit()` with placeholder API call ready for backend integration
- Enter key support for sending messages
- Message display area with user/assistant styling
- Loading skeleton state

**`ask-meal-genie/index.ts`**
- Clean barrel export for the widget

### Files Modified
**`DashboardView.tsx`**
- Updated import to use new widget from `./ask-meal-genie`
- Replaced `<AskMealGeniePlaceholder />` with `<AskMealGenieWidget />`

**`PlaceholderWidgets.tsx`**
- Removed `AskMealGeniePlaceholder` component
- Removed unused `Sparkles` and `Send` imports

### Component Features Ready
- ✅ Input textarea with placeholder text
- ✅ Send button (disabled when empty or loading)
- ✅ Enter key to send (Shift+Enter for newline)
- ✅ Message history display with role-based styling
- ✅ Loading state with skeleton
- ✅ Error handling structure
- 🔲 TODO: Backend API integration (marked in code)
