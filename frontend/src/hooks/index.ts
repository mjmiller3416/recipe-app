// UI hooks
export {
  useUnsavedChanges,
  hasAnyUnsavedChanges,
  getUnsavedChangesCheck,
  setNavigationBypass,
} from "./ui";
export { useSortableDnd } from "./ui";

// Persistence hooks
export { useSettings, type AppSettings, type UserProfile, DEFAULT_SETTINGS } from "./persistence";
export { useRecentRecipes, type RecentRecipe } from "./persistence";
export { useUnitConversionRules } from "./persistence";
export { useChatHistory } from "./persistence";

// Form hooks
export { useRecipeFilters, type UseRecipeFiltersOptions, type UseRecipeFiltersReturn } from "./forms";
export {
  useIngredientAutocomplete,
  type AutocompleteIngredient,
  type AutocompleteItem,
  type UseIngredientAutocompleteOptions,
  type UseIngredientAutocompleteReturn,
} from "./forms";
