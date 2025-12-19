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

## Low Priority
**Ingredients on Recipe View Page**
- **Location**: `src/app/recipes/[id]/page.tsx` (lines 45-60)
- **Issue**: Reorder ingredients based on the following categories: "Meat", 



## Completed
