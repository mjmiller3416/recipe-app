# Fix: Shopping List Status Indicator Not Updating

## Problem Analysis
The shopping list badge in the sidebar (`Sidebar.tsx`) shows the remaining items count. However, this count is only fetched once when the sidebar mounts. When items are checked/unchecked in `ShoppingListView.tsx`, the sidebar badge doesn't update because:
1. The Sidebar and ShoppingListView are separate components with no shared state
2. `handleToggleItem()` and `handleClearCompleted()` only update local state in ShoppingListView
3. No communication mechanism exists to notify the Sidebar to refetch

## Solution
Use a custom event system (simplest approach with minimal code impact):
1. Create a custom event `shopping-list-updated`
2. Dispatch this event from ShoppingListView when items are toggled or cleared
3. Have Sidebar listen for this event and refetch the shopping count

## Tasks
- [x] Add custom event dispatch in ShoppingListView after successful toggle/clear operations
- [x] Add event listener in Sidebar to refetch count when shopping list updates
- [x] Test the fix (TypeScript check passed)

## Review

### Changes Made

**ShoppingListView.tsx** (2 lines added):
- Line 95: Added `window.dispatchEvent(new Event("shopping-list-updated"))` after successful `toggleItem` API call
- Line 120: Added same event dispatch after successful `clearCompleted` API call

**Sidebar.tsx** (4 lines added):
- Lines 67-70: Added event listener for `shopping-list-updated` that calls `fetchShoppingCount()`
- Properly cleans up listener on unmount via return statement

### Why This Approach
- **Minimal code impact**: Only 6 lines of code added total
- **No new dependencies**: Uses native browser CustomEvent API
- **Decoupled**: Components don't need to know about each other
- **Clean**: Follows React patterns with proper cleanup in useEffect
- **Maintains optimistic UI**: Events fire after successful API calls, so the badge updates reflect confirmed server state
