// Recipe form constants and dropdown options
// Test comment to verify hooks are working

export const MEAL_TYPES = [
  { value: "all", label: "All" },
  { value: "appetizer", label: "Appetizer" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "dessert", label: "Dessert" },
  { value: "side", label: "Side" },
  { value: "snack", label: "Snack" },
  { value: "sauce", label: "Sauce" },
  { value: "other", label: "Other" },
] as const;

/**
 * @deprecated Use `useCategoryOptions()` hook from `@/hooks/api` instead.
 * Categories are now user-customizable and stored in the database.
 * This constant is kept for backwards compatibility only.
 */
export const RECIPE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "american", label: "American" },
  { value: "chinese", label: "Chinese" },
  { value: "french", label: "French" },
  { value: "indian", label: "Indian" },
  { value: "italian", label: "Italian" },
  { value: "japanese", label: "Japanese" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "mexican", label: "Mexican" },
  { value: "thai", label: "Thai" }
] as const;

// Form options excluding "All" - use for Add/Edit Recipe forms
export const MEAL_TYPE_OPTIONS = MEAL_TYPES.filter(t => t.value !== "all");

/**
 * @deprecated Use `useCategoryOptions().formOptions` from `@/hooks/api` instead.
 * Categories are now user-customizable and stored in the database.
 */
export const RECIPE_CATEGORY_OPTIONS = RECIPE_CATEGORIES.filter(c => c.value !== "all");

export const DIETARY_PREFERENCES = [
  { value: "none", label: "None" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "low-carb", label: "Low-Carb" },
  { value: "diabetic", label: "Diabetic" },
] as const;

// NOTE: Ingredient units are now fetched dynamically from the backend via the useUnits() hook.
// This eliminates the need to maintain duplicate unit lists and ensures the backend is the
// single source of truth. See: frontend/src/hooks/api/useUnits.ts

export const INGREDIENT_CATEGORIES = [
{ value: "produce", label: "Produce" },
  { value: "dairy", label: "Dairy" },
  { value: "deli", label: "Deli" },
  { value: "meat", label: "Meat" },
  { value: "condiments", label: "Condiments" },
  { value: "oils-and-vinegars", label: "Oils and Vinegars" },
  { value: "seafood", label: "Seafood" },
  { value: "pantry", label: "Pantry" },
  { value: "spices", label: "Spices" },
  { value: "frozen", label: "Frozen" },
  { value: "bakery", label: "Bakery" },
  { value: "baking", label: "Baking" },
  { value: "beverages", label: "Beverages" },
  { value: "other", label: "Other" },
] as const;

// Display order for ingredient categories on recipe detail page
// Meat first (as requested), then proteins, fresh items, and pantry staples
export const INGREDIENT_CATEGORY_ORDER = [
  "meat",
  "seafood",
  "produce",
  "dairy",
  "deli",
  "bakery",
  "frozen",
  "pantry",
  "condiments",
  "oils-and-vinegars",
  "spices",
  "baking",
  "beverages",
  "other",
] as const;

// ============================================================================
// Quick Filters for Recipe Browser Hero
// ============================================================================
// These are the one-click filter pills shown in the hero section.
// Edit this array to change what quick filters are available.
//
// Types:
//   - "mealType": filters by meal type (value should match MEAL_TYPES value, e.g., "breakfast")
//   - "dietary": filters by dietary preference (value should match DIETARY_PREFERENCES value, e.g., "vegetarian")
//   - "favorite": filters to show only favorites (value should be true)
//   - "time": filters recipes under X minutes (value should be a number)
//
// To add a new quick filter:
//   1. Add an entry to this array with a unique id
//   2. Set the appropriate type and value (use lowercase values from the constants above)
//   3. The label is what users see in the UI

export const QUICK_FILTERS = [
  { id: "breakfast", label: "Breakfast", type: "mealType", value: "breakfast" },
  { id: "lunch", label: "Lunch", type: "mealType", value: "lunch" },
  { id: "dinner", label: "Dinner", type: "mealType", value: "dinner" },
  { id: "dessert", label: "Dessert", type: "mealType", value: "dessert" },
  { id: "sides", label: "Sides", type: "mealType", value: "side" },
  { id: "sauce", label: "Sauce", type: "mealType", value: "sauce" },
  { id: "under30", label: "Under 30m", type: "time", value: 30 },
  { id: "vegetarian", label: "Vegetarian", type: "dietary", value: "vegetarian" },
  { id: "favorites", label: "Favorites", type: "favorite", value: true },
  { id: "new", label: "New", type: "new", value: 2 }, // Recipes added within last 2 days
] as const;

// Default quick filters shown in recipe browser (max 5)
export const DEFAULT_QUICK_FILTER_IDS = ["breakfast", "lunch", "dinner", "sides", "new"] as const;

// ============================================================================
// Type exports for TypeScript
// ============================================================================

export type MealType = (typeof MEAL_TYPES)[number]["value"];
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]["value"];
export type DietaryPreference = (typeof DIETARY_PREFERENCES)[number]["value"];
// IngredientUnit type is now inferred from the UnitOptionDTO returned by the useUnits() hook
export type IngredientUnit = string;
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]["value"];
export type QuickFilter = (typeof QUICK_FILTERS)[number];