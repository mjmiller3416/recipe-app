# Frontend TODO

## High Priority

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

## Medium Priority

### Allow Leading Decimals in Ingredient Quantities
  - **Location**: `frontend\src\lib\quantityUtils.ts` 
  - **Issue**: Currently, when adding quanties for ingredients, users cannot enter .5, .25, etc. They must enter 0.5, 0.25. Update the quantity input to accept leading decimals without a zero.
  - **Solution**: Update the regex in `QuantityInput.tsx` to allow leading decimals.

###
  - **Location**: `frontend\src\components\add-recipe\IngredientRow.tsx`
  - **Issue**: When adding new ingredients, the window should scroll to the newly added ingredient row to improve user experience.
  - **Solution**: Implement a scrollIntoView call after adding a new ingredient row.

### Fix Ingredient Autocomplete for Multi-Word Ingredients
  - **Location**: `frontend\src\components\add-recipe\IngredientAutoComplete.tsx`
  - **Issue**: The ingredient autocomplete stops suggesting ingredients once the user types a space. This makes it difficult to enter multi-word ingredients like "olive oil" or "baking soda".
  - **Solution**: Update the autocomplete logic to continue suggesting ingredients even after spaces are typed


## Low Priority

### Prevent Accidental Ingredient Deletion via Keyboard
  - **Location**: `frontend\src\components\add-recipe\IngredientRow.tsx` 
  - **Issue**: When using keyboard navigation to add ingredients, user can accidentally delete an ingredient row by pressing spacebar on the delete button -- can occur while tabbing through fields to add a new ingredient.
  - **Solution**: Update the delete button to only trigger deletion on Enter or Click events

###
  - **Location**: `frontend\src\components\add-recipe\IngredientAutoComplete.tsx` 
  - **Issue**: Selections cannot be selected via the Tab key, only via mouse click or Enter key. This makes keyboard navigation slower.
  - **Solution**: Update the autocomplete selection logic to allow Tab key selection of highlighted suggestions, then move focus to the next input field.

### Implement Drag-and-Drop Reordering of Ingredients
  - **Location**: `frontend\src\components\add-recipe\IngredientRow.tsx`
  - **Issue**: The ingredient row component does not currently support drag-and-drop reordering of ingredients. Implementing this feature would improve the user experience when adding or editing recipes.
  - **Solution**: Integrate a drag-and-drop library (e.g., react-beautiful-dnd) to enable reordering of ingredient rows.

### Reorder Ingredients on Recipe Page
- **Location**: `src/app/recipes/[id]/page.tsx` 
- **Issue**: Reorder ingredients on the recipe page so that the "Meat" category always appears first, followed by other categories in a logical order (e.g., Vegetables, Grains, Spices).
- **Solution**: Update the sorting logic when rendering ingredients to prioritize the "Meat" category first.



## Completed
