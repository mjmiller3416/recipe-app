# Frontend TODO

## 🔴 GitHub Issues

### #28 [Feature] Add "New Recipes" Filter in Meal Planner
- **Location**: Meal planner recipe selection dialog
- **Issue**: When adding a new meal to the meal planner, users want a filter for "new" recipes to quickly find recently added recipes.
- **Page**: `/meal-planner`

### #29 [Feedback] AI Image Style Concern
- **Category**: General Feedback
- **Issue**: Generated recipe images frequently show cast iron skillets — user preference issue with AI image generation prompts.
- **Page**: `/recipes/199`

---

## 🟠 High Priority

### 1. Re-enable Ingredient Form Validation
- **Location**: `src/app/recipes/add/page.tsx` (lines 174-176)
- **Components affected**: `QuantityInput.tsx`, `IngredientRow.tsx`
- **What was disabled**:
  - Individual ingredient name validation (length checks)
  - Quantity validation (bounds checking)
  - Visual error feedback in QuantityInput (red border on invalid input)
- **Why**: Validation was too strict during recipe entry, making it cumbersome to add recipes quickly
- **To re-enable**:
  1. Restore the ingredient validation loop in `add/page.tsx`
  2. Restore the `isInvalid` styling in `QuantityInput.tsx`
  3. Consider making validation less strict or only on submit

## 🟡 Medium Priority

### 2. Auto-Scroll to New Ingredient Row
- **Location**: `frontend/src/components/add-recipe/IngredientRow.tsx`
- **Issue**: When adding new ingredients, the window should scroll to the newly added ingredient row to improve user experience.
- **Solution**: Implement a scrollIntoView call after adding a new ingredient row.

### 3. Add Favorite Button to Meal Planner Cards
- **Location**: `src/app/meal-planner/_components/meal-display/MainDishCard.tsx`
- **Issue**: Users cannot favorite a recipe directly from the meal planner page — they must navigate to the recipe detail page first.
- **Solution**: Import and add the existing `FavoriteButton` component to MainDishCard, passing `recipeId` and `isFavorite` props. Consider adding to SideDishSlots as well for consistency.

## 🔵 Low Priority

### 4. Prevent Accidental Ingredient Deletion via Keyboard
- **Location**: `frontend/src/components/add-recipe/IngredientRow.tsx`
- **Issue**: When using keyboard navigation to add ingredients, user can accidentally delete an ingredient row by pressing spacebar on the delete button — can occur while tabbing through fields to add a new ingredient.
- **Solution**: Update the delete button to only trigger deletion on Enter or Click events.

### 5. Enable Tab Key Selection in Autocomplete
- **Location**: `frontend/src/components/add-recipe/IngredientAutoComplete.tsx`
- **Issue**: Selections cannot be selected via the Tab key, only via mouse click or Enter key. This makes keyboard navigation slower.
- **Solution**: Update the autocomplete selection logic to allow Tab key selection of highlighted suggestions, then move focus to the next input field.

### 6. Reorder Ingredients on Recipe Page
- **Location**: `src/app/recipes/[id]/page.tsx`
- **Issue**: Reorder ingredients on the recipe page so that the "Meat" category always appears first, followed by other categories in a logical order (e.g., Vegetables, Grains, Spices).
- **Solution**: Update the sorting logic when rendering ingredients to prioritize the "Meat" category first.

### 7. Add Zoom-on-Hover to Side Dish Cards
- **Location**: `src/app/meal-planner/_components/meal-display/SideDishSlots.tsx`
- **Issue**: Side dish recipe cards in the meal planner lack the subtle zoom effect on hover that main dish cards have — making the interaction feel less polished.
- **Solution**: Add `transition-transform duration-500 group-hover:scale-105` to the `RecipeCardImage` component (line 86), matching the pattern used in `MainDishCard.tsx`.

### 8. Add Print Preview Page with Element Toggles
- **Location**: `src/app/recipes/[id]/_components/FullRecipeView.tsx`
- **Issue**: Long recipes overflow the page in print preview — users have no way to customize what prints to keep content on one page.
- **Solution**: Create a print preview modal with toggle controls (image, notes, etc.) that dynamically adjusts the print layout, allowing users to fit most recipes on a single page.

## ✅ Completed

### Allow Leading Decimals in Ingredient Quantities
- **Location**: `frontend/src/lib/quantityUtils.ts`
- **Issue**: When adding quantities for ingredients, users could not enter .5, .25, etc. They had to enter 0.5, 0.25.
- **Solution**: Updated the regex in `parseQuantity` to allow leading decimals using alternation pattern.

### Shopping List Items Uncheck When Quantity Changes
- **Location**: Shopping list state management
- **Issue**: When adding a new recipe to the meal planner, shopping list items that have been checked off get updated quantities but remain checked — they should be unchecked to indicate the new quantity needs to be collected.
- **Solution**: Items are now automatically unchecked when their quantity increases, so users know to collect the additional amount.

### First Uncompleted Meal Should Be Selected by Default
- **Location**: `src/app/meal-planner/_components/MealPlannerView.tsx`
- **Issue**: When loading the meal planner, no meal is selected by default — the first uncompleted meal should be auto-selected for convenience.
- **Solution**: Changed the auto-selection logic to find the first uncompleted entry using `data.find((e) => !e.is_completed)`, with a fallback to the first entry if all meals are completed.

### Auto-Focus New Ingredient Row
- **Location**: `src/app/recipes/add/page.tsx`, `IngredientRow.tsx`
- **Issue**: When clicking "Add Ingredient", the cursor should automatically move to the first field (ingredient name) of the newly added empty row.
- **Solution**: Added auto-focus to the ingredient name input when a new row is added.

### Remove Duplicate "Pico De Gallo" Ingredient
- **Location**: Database (ingredients table)
- **Issue**: There are two "Pico De Gallo" entries — one incorrectly categorized as "baking". Remove the duplicate.
- **Solution**: Deleted the duplicate entry with incorrect "baking" category, keeping only the correct categorization.

### Fix Active Filters to Display on Single Row
- **Location**: `src/components/common/FilterPillGroup.tsx`
- **Issue**: Active filters wrap to multiple rows when there are many filters selected — should stay on a single row for cleaner UI.
- **Solution**: Replaced `flex-wrap` with `flex-nowrap` and added horizontal scroll (`overflow-x-auto`) to keep all pills on one row with scrolling when needed.

### Fix Unit Capitalization in Recipe Display
- **Location**: `src/app/recipes/[id]/_components/IngredientItem.tsx`
- **Issue**: After saving a recipe, "Tbs" displays as lowercase "tbs" — the component directly renders the stored unit value instead of its display label from `INGREDIENT_UNITS`.
- **Solution**: Look up the unit's `label` from `INGREDIENT_UNITS` constant instead of displaying the raw `value`. Use a helper like `INGREDIENT_UNITS.find(u => u.value === unit)?.label || unit`.

### Reorder Shopping List Stats Layout
- **Location**: `src/app/shopping-list/_components/ShoppingListView.tsx`
- **Issue**: The stat cards at the top of the shopping list display as Total → Collected → Remaining, but Remaining → Collected → Total provides a more logical left-to-right flow.
- **Solution**: Reordered the `StatCard` components to display Remaining first, Collected second, and Total Items third.

### Display Quantity Before Item Name in Shopping List
- **Location**: `src/app/shopping-list/_components/ShoppingItem.tsx`
- **Issue**: Shopping list items currently display as "Ingredient Name ... Quantity" — users want to see quantities first for easier scanning while shopping.
- **Solution**: Moved the quantity badge to appear between the Checkbox and the item content section for easier scanning while shopping.

### Fix Squared-Off Card Shadows
- **Location**: `src/components/ui/card.tsx`
- **Issue**: Card shadows appear squared off because child content overflows the rounded corners — most noticeable on MealPlanner cards where images or content peek outside the border-radius.
- **Solution**: Added `overflow-hidden` to the base Card component to ensure all child content respects the rounded corners.

### Fix Quick Filter Chips Adding Duplicate Active Filters
- **Location**: `src/app/recipes/_components/RecipeBrowserView.tsx`
- **Issue**: Clicking a quick filter pill (e.g., "Dessert") in the hero section adds the filter twice to the Active Filters display — visible as duplicate chips showing the same filter value.
- **Solution**: Refactor `handleQuickFilterToggle` (line 471) to move the `setFilters` call outside of the `setActiveQuickFilters` callback — nested setState calls inside updater functions can cause React batching issues that lead to duplicate state entries.

### Fix Dropdown Layout Shift
- **Location**: `src/app/globals.css`
- **Issue**: When opening dialogs or dropdowns on scrollable pages (RecipeBrowser, AddEditRecipes), the page content shifted due to double scrollbar compensation — Radix UI added padding for a "removed" scrollbar that never actually disappeared.
- **Solution**: Added `overflow-y: scroll` to html (force scrollbar always visible) and `body[data-scroll-locked]` override to prevent Radix from adding unnecessary padding compensation.

### Convert Shopping List Quantities to Fractions
- **Location**: `src/app/shopping-list/_components/ShoppingItem.tsx`
- **Issue**: Shopping list quantities display as decimals (0.5, 0.25) instead of user-friendly fractions (½, ¼) — making them harder to read while shopping.
- **Solution**: Replace the inline quantity formatting with the existing `formatQuantity` utility from `@/lib/quantityUtils` which already handles decimal-to-fraction conversion.

### Fix Favorites Only Toggle in Recipe Browser
- **Location**: `src/app/recipes/_components/RecipeBrowserView.tsx`
- **Issue**: Clicking the "Favorites Only" checkbox did nothing — a `useEffect` that syncs `filters.favoritesOnly` with URL params was immediately undoing the state change because the URL didn't have the `?favoritesOnly=true` param.
- **Solution**: Updated the checkbox handler to use `router.replace()` to update the URL, letting the existing `useEffect` handle the state sync. Also added `isFavorite: dto.is_favorite ?? false` in `recipeCardMapper.ts` for safety.

### Implement Drag-and-Drop Reordering of Ingredients
- **Location**: `frontend/src/app/recipes/_components/add-edit/IngredientRow.tsx`
- **Issue**: The ingredient row component did not support drag-and-drop reordering of ingredients.
- **Solution**: Integrated `@dnd-kit/sortable` (already installed) to enable reordering of ingredient rows with keyboard and touch accessibility.

### Remove Duplicate "Ranch Seasoning" Ingredient
- **Location**: Database (ingredients table)
- **Issue**: "Ranch Seasoning" appeared in both Pantry and Spices categories — causing duplicate entries in autocomplete and recipe ingredients.
- **Solution**: Deleted the duplicate Pantry entry, keeping only the Spices categorization.

### Fix Ingredient Autocomplete for Multi-Word Ingredients
- **Location**: `frontend/src/components/add-recipe/IngredientAutoComplete.tsx`
- **Issue**: The ingredient autocomplete stops suggesting ingredients once the user types a space. This makes it difficult to enter multi-word ingredients like "olive oil" or "baking soda".
- **Solution**: Update the autocomplete logic to continue suggesting ingredients even after spaces are typed.