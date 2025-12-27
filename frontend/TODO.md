# Frontend TODO

## 🟠 High Priority

### Re-enable Ingredient Form Validation
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

### Allow Leading Decimals in Ingredient Quantities
- **Location**: `frontend/src/lib/quantityUtils.ts`
- **Issue**: Currently, when adding quanties for ingredients, users cannot enter .5, .25, etc. They must enter 0.5, 0.25. Update the quantity input to accept leading decimals without a zero.
- **Solution**: Update the regex in `QuantityInput.tsx` to allow leading decimals.

### Auto-Scroll to New Ingredient Row
- **Location**: `frontend/src/components/add-recipe/IngredientRow.tsx`
- **Issue**: When adding new ingredients, the window should scroll to the newly added ingredient row to improve user experience.
- **Solution**: Implement a scrollIntoView call after adding a new ingredient row.

### Fix Squared-Off Card Shadows
- **Location**: `src/components/ui/card.tsx`
- **Issue**: Card shadows appear squared off because child content overflows the rounded corners — most noticeable on MealPlanner cards where images or content peek outside the border-radius.
- **Solution**: Add `overflow-hidden` to the base Card component (line 10) to ensure all child content respects the rounded corners.

### Add Favorite Button to Meal Planner Cards
- **Location**: `src/app/meal-planner/_components/meal-display/MainDishCard.tsx`
- **Issue**: Users cannot favorite a recipe directly from the meal planner page — they must navigate to the recipe detail page first.
- **Solution**: Import and add the existing `FavoriteButton` component to MainDishCard, passing `recipeId` and `isFavorite` props. Consider adding to SideDishSlots as well for consistency.

## 🔵 Low Priority

### Prevent Accidental Ingredient Deletion via Keyboard
- **Location**: `frontend/src/components/add-recipe/IngredientRow.tsx`
- **Issue**: When using keyboard navigation to add ingredients, user can accidentally delete an ingredient row by pressing spacebar on the delete button — can occur while tabbing through fields to add a new ingredient.
- **Solution**: Update the delete button to only trigger deletion on Enter or Click events.

### Enable Tab Key Selection in Autocomplete
- **Location**: `frontend/src/components/add-recipe/IngredientAutoComplete.tsx`
- **Issue**: Selections cannot be selected via the Tab key, only via mouse click or Enter key. This makes keyboard navigation slower.
- **Solution**: Update the autocomplete selection logic to allow Tab key selection of highlighted suggestions, then move focus to the next input field.

### Reorder Ingredients on Recipe Page
- **Location**: `src/app/recipes/[id]/page.tsx`
- **Issue**: Reorder ingredients on the recipe page so that the "Meat" category always appears first, followed by other categories in a logical order (e.g., Vegetables, Grains, Spices).
- **Solution**: Update the sorting logic when rendering ingredients to prioritize the "Meat" category first.

### Fix Dropdown Layout Shift in Recipe Form
- **Location**: `src/app/recipes/_components/add-edit/RecipeInfoCard.tsx`
- **Issue**: When opening the Meal Type, Category, or Dietary Preference dropdowns, the SelectContent pushes page content instead of overlaying — causing a jarring layout shift.
- **Solution**: Add `position="popper"` to each `<SelectContent>` component to use floating UI positioning instead of the default item-aligned behavior.

### Add Zoom-on-Hover to Side Dish Cards
- **Location**: `src/app/meal-planner/_components/meal-display/SideDishSlots.tsx`
- **Issue**: Side dish recipe cards in the meal planner lack the subtle zoom effect on hover that main dish cards have — making the interaction feel less polished.
- **Solution**: Add `transition-transform duration-500 group-hover:scale-105` to the `RecipeCardImage` component (line 86), matching the pattern used in `MainDishCard.tsx`.

### Reorder Shopping List Stats Layout
- **Location**: `src/app/shopping-list/_components/ShoppingListView.tsx`
- **Issue**: The stat cards at the top of the shopping list display as Total → Collected → Remaining, but Remaining → Collected → Total provides a more logical left-to-right flow.
- **Solution**: Reorder the `StatCard` components in lines 237-252 to display Remaining first, Collected second, and Total Items third.

### Display Quantity Before Item Name in Shopping List
- **Location**: `src/app/shopping-list/_components/ShoppingItem.tsx`
- **Issue**: Shopping list items currently display as "Ingredient Name ... Quantity" — users want to see quantities first for easier scanning while shopping.
- **Solution**: Move the quantity badge (lines 94-103) to appear between the Checkbox and the item content section, updating the flex layout accordingly.

### Convert Shopping List Quantities to Fractions
- **Location**: `src/app/shopping-list/_components/ShoppingItem.tsx`
- **Issue**: Shopping list quantities display as decimals (0.5, 0.25) instead of user-friendly fractions (½, ¼) — making them harder to read while shopping.
- **Solution**: Replace the inline quantity formatting (lines 26-34) with the existing `formatQuantity` utility from `@/lib/quantityUtils` which already handles decimal-to-fraction conversion.

### Add Print Preview Page with Element Toggles
- **Location**: `src/app/recipes/[id]/_components/FullRecipeView.tsx`
- **Issue**: Long recipes overflow the page in print preview — users have no way to customize what prints to keep content on one page.
- **Solution**: Create a print preview modal with toggle controls (image, notes, etc.) that dynamically adjusts the print layout, allowing users to fit most recipes on a single page.

## ✅ Completed

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