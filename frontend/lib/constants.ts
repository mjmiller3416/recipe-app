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
  { value: "ground-beef", label: "Ground Beef" },
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
  { value: "beverages", label: "Beverages" },
  { value: "other", label: "Other" },
] as const;

// Type exports for TypeScript
export type MealType = typeof MEAL_TYPES[number]["value"];
export type RecipeCategory = typeof RECIPE_CATEGORIES[number]["value"];
export type DietaryPreference = typeof DIETARY_PREFERENCES[number]["value"];
export type IngredientUnit = typeof INGREDIENT_UNITS[number]["value"];
export type IngredientCategory = typeof INGREDIENT_CATEGORIES[number]["value"];
