// Recipe form constants and dropdown options

export const MEAL_TYPES = [
  { value: "all", label: "All" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "dessert", label: "Dessert" },
  { value: "snack", label: "Snack" },
] as const;

export const RECIPE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "beef", label: "Beef" },
  { value: "chicken", label: "Chicken" },
  { value: "seafood", label: "Seafood" },
  { value: "veggie", label: "Veggie" },
  { value: "other", label: "Other" },
] as const;

export const DIETARY_PREFERENCES = [
  { value: "none", label: "None" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "low-carb", label: "Low-Carb" },
] as const;

export const INGREDIENT_UNITS = [
  { value: "tbs", label: "Tbs" },
  { value: "tsp", label: "tsp" },
  { value: "cup", label: "cup" },
  { value: "oz", label: "oz" },
  { value: "lbs", label: "lbs" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "L" },
  { value: "bag", label: "bag" },
  { value: "box", label: "box" },
  { value: "can", label: "can" },
  { value: "jar", label: "jar" },
  { value: "package", label: "package" },
  { value: "piece", label: "piece" },
  { value: "whole", label: "whole" },
  { value: "pinch", label: "pinch" },
  { value: "dash", label: "dash" },
  { value: "to-taste", label: "to taste" },
] as const;

export const INGREDIENT_CATEGORIES = [
{ value: "produce", label: "Produce" },
  { value: "dairy", label: "Dairy" },
  { value: "meat", label: "Meat" },
  { value: "seafood", label: "Seafood" },
  { value: "pantry", label: "Pantry" },
  { value: "spices", label: "Spices" },
  { value: "frozen", label: "Frozen" },
  { value: "bakery", label: "Bakery" },
  { value: "baking", label: "Baking" },
  { value: "beverages", label: "Beverages" },
  { value: "other", label: "Other" },
] as const;

// ============================================================================
// Quick Filters for Recipe Browser Hero
// ============================================================================
// These are the one-click filter pills shown in the hero section.
// Edit this array to change what quick filters are available.
// 
// Types:
//   - "mealType": filters by meal type (value should match MEAL_TYPES label)
//   - "dietary": filters by dietary preference (value should match DIETARY_PREFERENCES label)  
//   - "favorite": filters to show only favorites (value should be true)
//   - "time": filters recipes under X minutes (value should be a number)
//
// To add a new quick filter:
//   1. Add an entry to this array with a unique id
//   2. Set the appropriate type and value
//   3. The label is what users see in the UI

export const QUICK_FILTERS = [
  { id: "breakfast", label: "Breakfast", type: "mealType", value: "Breakfast" },
  { id: "under30", label: "Under 30m", type: "time", value: 30 },
  { id: "dinner", label: "Dinner", type: "mealType", value: "Dinner" },
  { id: "vegetarian", label: "Vegetarian", type: "dietary", value: "Vegetarian" },
  { id: "favorites", label: "Favorites", type: "favorite", value: true },
] as const;

// ============================================================================
// Type exports for TypeScript
// ============================================================================

export type MealType = (typeof MEAL_TYPES)[number]["value"];
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]["value"];
export type DietaryPreference = (typeof DIETARY_PREFERENCES)[number]["value"];
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number]["value"];
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]["value"];
export type QuickFilter = (typeof QUICK_FILTERS)[number];