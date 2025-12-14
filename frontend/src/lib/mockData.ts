// src/lib/mockData.ts

import type {
  RecipeResponseDTO,
  RecipeCardDTO,
  IngredientResponseDTO,
  MealSelectionResponseDTO,
  ShoppingItemResponseDTO,
  ShoppingListResponseDTO,
} from "@/types";

// ============================================================================
// INGREDIENTS - Base ingredient table (just name + category, no quantities)
// ============================================================================
export const mockIngredients: IngredientResponseDTO[] = [
  // Proteins
  { id: 1, ingredient_name: "Chicken Breast", ingredient_category: "Protein" },
  { id: 2, ingredient_name: "Ground Beef", ingredient_category: "Protein" },
  { id: 3, ingredient_name: "Salmon Fillet", ingredient_category: "Protein" },
  { id: 4, ingredient_name: "Bacon", ingredient_category: "Protein" },
  { id: 5, ingredient_name: "Eggs", ingredient_category: "Protein" },
  { id: 6, ingredient_name: "Shrimp", ingredient_category: "Protein" },
  { id: 7, ingredient_name: "Tofu", ingredient_category: "Protein" },
  { id: 8, ingredient_name: "Pork Chops", ingredient_category: "Protein" },

  // Vegetables
  { id: 9, ingredient_name: "Onion", ingredient_category: "Vegetables" },
  { id: 10, ingredient_name: "Garlic", ingredient_category: "Vegetables" },
  { id: 11, ingredient_name: "Bell Pepper", ingredient_category: "Vegetables" },
  { id: 12, ingredient_name: "Tomato", ingredient_category: "Vegetables" },
  { id: 13, ingredient_name: "Broccoli", ingredient_category: "Vegetables" },
  { id: 14, ingredient_name: "Spinach", ingredient_category: "Vegetables" },
  { id: 15, ingredient_name: "Carrots", ingredient_category: "Vegetables" },
  { id: 16, ingredient_name: "Mushrooms", ingredient_category: "Vegetables" },
  { id: 17, ingredient_name: "Zucchini", ingredient_category: "Vegetables" },

  // Pasta & Grains
  { id: 18, ingredient_name: "Spaghetti", ingredient_category: "Pasta" },
  { id: 19, ingredient_name: "Penne Pasta", ingredient_category: "Pasta" },
  { id: 20, ingredient_name: "Rice", ingredient_category: "Grains" },
  { id: 21, ingredient_name: "Quinoa", ingredient_category: "Grains" },

  // Dairy
  { id: 22, ingredient_name: "Parmesan Cheese", ingredient_category: "Dairy" },
  { id: 23, ingredient_name: "Mozzarella", ingredient_category: "Dairy" },
  { id: 24, ingredient_name: "Butter", ingredient_category: "Dairy" },
  { id: 25, ingredient_name: "Heavy Cream", ingredient_category: "Dairy" },
  { id: 26, ingredient_name: "Greek Yogurt", ingredient_category: "Dairy" },

  // Oils & Condiments
  { id: 27, ingredient_name: "Olive Oil", ingredient_category: "Oils & Fats" },
  { id: 28, ingredient_name: "Soy Sauce", ingredient_category: "Condiments" },

  // Spices & Seasonings
  { id: 29, ingredient_name: "Salt", ingredient_category: "Spices" },
  { id: 30, ingredient_name: "Black Pepper", ingredient_category: "Spices" },
  { id: 31, ingredient_name: "Cumin", ingredient_category: "Spices" },
  { id: 32, ingredient_name: "Paprika", ingredient_category: "Spices" },
  { id: 33, ingredient_name: "Oregano", ingredient_category: "Herbs" },
  { id: 34, ingredient_name: "Basil", ingredient_category: "Herbs" },
  { id: 35, ingredient_name: "Cilantro", ingredient_category: "Herbs" },

  // Baking & Pantry
  { id: 36, ingredient_name: "Sugar", ingredient_category: "Baking" },
  { id: 37, ingredient_name: "Flour", ingredient_category: "Baking" },
  { id: 38, ingredient_name: "Chicken Broth", ingredient_category: "Pantry" },
  { id: 39, ingredient_name: "Vegetable Broth", ingredient_category: "Pantry" },
  { id: 40, ingredient_name: "Tortillas", ingredient_category: "Bread" },
  { id: 41, ingredient_name: "Lemon", ingredient_category: "Produce" },
  { id: 42, ingredient_name: "Lime", ingredient_category: "Produce" },
];

// ============================================================================
// RECIPES - Full recipe data with denormalized ingredients
// ============================================================================
export const mockRecipes: RecipeResponseDTO[] = [
  {
    id: 1,
    recipe_name: "Classic Carbonara",
    recipe_category: "Pasta",
    meal_type: "Dinner",
    diet_pref: null,
    total_time: 30,
    servings: 4,
    directions: `1. Bring a large pot of salted water to boil and cook spaghetti according to package directions.
2. While pasta cooks, cut bacon into small pieces and cook in a large skillet until crispy.
3. In a bowl, whisk together eggs, grated Parmesan, and black pepper.
4. Reserve 1 cup pasta water, then drain pasta.
5. Remove skillet from heat and add hot pasta to the bacon.
6. Quickly stir in egg mixture, adding pasta water as needed to create a creamy sauce.
7. Serve immediately with extra Parmesan and black pepper.`,
    notes: "Use freshly grated Parmesan for best results. The key is to work quickly so the eggs don't scramble.",
    reference_image_path: "/mock/recipes/spaghetti-carbonara.png",
    banner_image_path: "/mock/recipes/spaghetti-carbonara.png",
    is_favorite: true,
    created_at: "2024-01-15T10:30:00Z",
    ingredients: [
      { id: 18, ingredient_name: "Spaghetti", ingredient_category: "Pasta", quantity: 1, unit: "lb" },
      { id: 4, ingredient_name: "Bacon", ingredient_category: "Protein", quantity: 8, unit: "slices" },
      { id: 5, ingredient_name: "Eggs", ingredient_category: "Protein", quantity: 4, unit: "whole" },
      { id: 22, ingredient_name: "Parmesan Cheese", ingredient_category: "Dairy", quantity: 1, unit: "cup" },
      { id: 30, ingredient_name: "Black Pepper", ingredient_category: "Spices", quantity: 1, unit: "tsp" },
    ],
  },
  {
    id: 2,
    recipe_name: "Honey Garlic Salmon",
    recipe_category: "Seafood",
    meal_type: "Dinner",
    diet_pref: "Pescatarian",
    total_time: 25,
    servings: 2,
    directions: `1. Preheat oven to 400°F (200°C).
2. Place salmon fillets on a lined baking sheet.
3. Mix honey, soy sauce, minced garlic, and lemon juice.
4. Brush half of the glaze over the salmon.
5. Bake for 12-15 minutes until salmon flakes easily.
6. Brush with remaining glaze and broil for 2 minutes.`,
    notes: "Don't overcook! Salmon should be slightly translucent in the center.",
    reference_image_path: "/mock/recipes/honey-garlic-glazed-salmon.png",
    banner_image_path: "/mock/recipes/honey-garlic-glazed-salmon.png",
    is_favorite: true,
    created_at: "2024-02-20T14:15:00Z",
    ingredients: [
      { id: 3, ingredient_name: "Salmon Fillet", ingredient_category: "Protein", quantity: 2, unit: "fillets" },
      { id: 36, ingredient_name: "Sugar", ingredient_category: "Baking", quantity: 0.25, unit: "cup" },
      { id: 28, ingredient_name: "Soy Sauce", ingredient_category: "Condiments", quantity: 3, unit: "tbsp" },
      { id: 10, ingredient_name: "Garlic", ingredient_category: "Vegetables", quantity: 3, unit: "cloves" },
      { id: 41, ingredient_name: "Lemon", ingredient_category: "Produce", quantity: 1, unit: "whole" },
    ],
  },
  {
    id: 3,
    recipe_name: "Beef Tacos",
    recipe_category: "Mexican",
    meal_type: "Dinner",
    diet_pref: null,
    total_time: 20,
    servings: 4,
    directions: `1. Heat a large skillet over medium-high heat.
2. Cook ground beef until browned.
3. Add cumin, paprika, salt and garlic.
4. Warm tortillas in a dry pan.
5. Assemble tacos with meat and toppings.`,
    notes: "Great with fresh salsa, sour cream, and lime wedges.",
    reference_image_path: "/mock/recipes/beef-tacos.png",
    banner_image_path: "/mock/recipes/beef-tacos.png",
    is_favorite: false,
    created_at: "2024-03-05T18:45:00Z",
    ingredients: [
      { id: 2, ingredient_name: "Ground Beef", ingredient_category: "Protein", quantity: 1, unit: "lb" },
      { id: 40, ingredient_name: "Tortillas", ingredient_category: "Bread", quantity: 8, unit: "whole" },
      { id: 31, ingredient_name: "Cumin", ingredient_category: "Spices", quantity: 1, unit: "tsp" },
      { id: 32, ingredient_name: "Paprika", ingredient_category: "Spices", quantity: 0.5, unit: "tsp" },
      { id: 10, ingredient_name: "Garlic", ingredient_category: "Vegetables", quantity: 2, unit: "cloves" },
      { id: 42, ingredient_name: "Lime", ingredient_category: "Produce", quantity: 2, unit: "whole" },
    ],
  },
  {
    id: 4,
    recipe_name: "Vegetable Stir Fry",
    recipe_category: "Asian",
    meal_type: "Dinner",
    diet_pref: "Vegetarian",
    total_time: 15,
    servings: 2,
    directions: `1. Prepare all vegetables - slice bell peppers, broccoli, carrots.
2. Heat oil in a wok over high heat.
3. Add vegetables in order of cooking time.
4. Add soy sauce and seasonings.
5. Serve over rice.`,
    notes: "Have all ingredients prepped before starting - stir fry goes fast!",
    reference_image_path: "/mock/recipes/vegetable-stir-fry.png",
    banner_image_path: "/mock/recipes/vegetable-stir-fry.png",
    is_favorite: false,
    created_at: "2024-03-10T12:00:00Z",
    ingredients: [
      { id: 11, ingredient_name: "Bell Pepper", ingredient_category: "Vegetables", quantity: 2, unit: "whole" },
      { id: 13, ingredient_name: "Broccoli", ingredient_category: "Vegetables", quantity: 2, unit: "cups" },
      { id: 15, ingredient_name: "Carrots", ingredient_category: "Vegetables", quantity: 2, unit: "whole" },
      { id: 28, ingredient_name: "Soy Sauce", ingredient_category: "Condiments", quantity: 3, unit: "tbsp" },
      { id: 27, ingredient_name: "Olive Oil", ingredient_category: "Oils & Fats", quantity: 2, unit: "tbsp" },
      { id: 20, ingredient_name: "Rice", ingredient_category: "Grains", quantity: 1, unit: "cup" },
    ],
  },
  {
    id: 5,
    recipe_name: "Caprese Salad",
    recipe_category: "Salad",
    meal_type: "Side",
    diet_pref: "Vegetarian",
    total_time: 10,
    servings: 4,
    directions: `1. Slice tomatoes and mozzarella into 1/4 inch rounds.
2. Arrange alternating on a platter.
3. Tuck fresh basil leaves between slices.
4. Drizzle with olive oil.
5. Season with salt and pepper.`,
    notes: "Use the freshest tomatoes and mozzarella you can find.",
    reference_image_path: "/mock/recipes/caprese-salad.png",
    banner_image_path: "/mock/recipes/caprese-salad.png",
    is_favorite: true,
    created_at: "2024-03-15T09:30:00Z",
    ingredients: [
      { id: 12, ingredient_name: "Tomato", ingredient_category: "Vegetables", quantity: 4, unit: "whole" },
      { id: 23, ingredient_name: "Mozzarella", ingredient_category: "Dairy", quantity: 8, unit: "oz" },
      { id: 34, ingredient_name: "Basil", ingredient_category: "Herbs", quantity: 0.5, unit: "cup" },
      { id: 27, ingredient_name: "Olive Oil", ingredient_category: "Oils & Fats", quantity: 2, unit: "tbsp" },
      { id: 29, ingredient_name: "Salt", ingredient_category: "Spices", quantity: 0.5, unit: "tsp" },
    ],
  },
  {
    id: 6,
    recipe_name: "Garlic Butter Shrimp",
    recipe_category: "Seafood",
    meal_type: "Dinner",
    diet_pref: "Pescatarian",
    total_time: 15,
    servings: 2,
    directions: `1. Melt butter in a large skillet over medium heat.
2. Add garlic and cook until fragrant.
3. Add shrimp in a single layer.
4. Cook 2-3 minutes per side until pink.
5. Season and serve immediately.`,
    notes: "Don't overcook the shrimp - they cook quickly!",
    reference_image_path: "/mock/recipes/garlic-butter-shrimp.png",
    banner_image_path: "/mock/recipes/garlic-butter-shrimp.png",
    is_favorite: false,
    created_at: "2024-04-01T19:00:00Z",
    ingredients: [
      { id: 6, ingredient_name: "Shrimp", ingredient_category: "Protein", quantity: 1, unit: "lb" },
      { id: 24, ingredient_name: "Butter", ingredient_category: "Dairy", quantity: 4, unit: "tbsp" },
      { id: 10, ingredient_name: "Garlic", ingredient_category: "Vegetables", quantity: 4, unit: "cloves" },
      { id: 41, ingredient_name: "Lemon", ingredient_category: "Produce", quantity: 1, unit: "whole" },
      { id: 29, ingredient_name: "Salt", ingredient_category: "Spices", quantity: 0.5, unit: "tsp" },
    ],
  },
  {
    id: 7,
    recipe_name: "Chicken Caesar Salad",
    recipe_category: "Salad",
    meal_type: "Lunch",
    diet_pref: null,
    total_time: 25,
    servings: 2,
    directions: `1. Season chicken breasts with salt and pepper.
2. Grill or pan-fry until cooked through.
3. Let rest, then slice.
4. Toss romaine with Caesar dressing.
5. Top with chicken and Parmesan.`,
    notes: "Homemade Caesar dressing makes a big difference.",
    reference_image_path: "/mock/recipes/grilled-chicken-caesar-salad.png",
    banner_image_path: "/mock/recipes/grilled-chicken-caesar-salad.png",
    is_favorite: true,
    created_at: "2024-04-10T12:30:00Z",
    ingredients: [
      { id: 1, ingredient_name: "Chicken Breast", ingredient_category: "Protein", quantity: 2, unit: "whole" },
      { id: 22, ingredient_name: "Parmesan Cheese", ingredient_category: "Dairy", quantity: 0.5, unit: "cup" },
      { id: 27, ingredient_name: "Olive Oil", ingredient_category: "Oils & Fats", quantity: 2, unit: "tbsp" },
      { id: 29, ingredient_name: "Salt", ingredient_category: "Spices", quantity: 0.5, unit: "tsp" },
      { id: 30, ingredient_name: "Black Pepper", ingredient_category: "Spices", quantity: 0.25, unit: "tsp" },
    ],
  },
  {
    id: 8,
    recipe_name: "Mushroom Risotto",
    recipe_category: "Italian",
    meal_type: "Dinner",
    diet_pref: "Vegetarian",
    total_time: 45,
    servings: 4,
    directions: `1. Heat broth in a saucepan and keep warm.
2. Sauté mushrooms in butter, set aside.
3. Sauté onion, add rice and toast.
4. Add broth one ladle at a time, stirring constantly.
5. Fold in mushrooms, Parmesan, and butter.`,
    notes: "Patience is key - don't rush the broth additions.",
    reference_image_path: "/mock/recipes/placeholder.png",
    banner_image_path: "/mock/recipes/placeholder.png",
    is_favorite: false,
    created_at: "2024-04-20T18:00:00Z",
    ingredients: [
      { id: 20, ingredient_name: "Rice", ingredient_category: "Grains", quantity: 1.5, unit: "cups" },
      { id: 16, ingredient_name: "Mushrooms", ingredient_category: "Vegetables", quantity: 8, unit: "oz" },
      { id: 39, ingredient_name: "Vegetable Broth", ingredient_category: "Pantry", quantity: 4, unit: "cups" },
      { id: 22, ingredient_name: "Parmesan Cheese", ingredient_category: "Dairy", quantity: 0.5, unit: "cup" },
      { id: 24, ingredient_name: "Butter", ingredient_category: "Dairy", quantity: 3, unit: "tbsp" },
      { id: 9, ingredient_name: "Onion", ingredient_category: "Vegetables", quantity: 1, unit: "whole" },
    ],
  },
  {
    id: 9,
    recipe_name: "Teriyaki Chicken Bowl",
    recipe_category: "Asian",
    meal_type: "Dinner",
    diet_pref: null,
    total_time: 30,
    servings: 2,
    directions: `1. Cook rice according to package directions.
2. Slice chicken and season.
3. Cook chicken in a hot pan.
4. Add teriyaki sauce and coat well.
5. Serve over rice with vegetables.`,
    notes: "Great for meal prep - keeps well in the fridge.",
    reference_image_path: "/mock/recipes/placeholder.png",
    banner_image_path: "/mock/recipes/placeholder.png",
    is_favorite: false,
    created_at: "2024-05-01T17:30:00Z",
    ingredients: [
      { id: 1, ingredient_name: "Chicken Breast", ingredient_category: "Protein", quantity: 1, unit: "lb" },
      { id: 20, ingredient_name: "Rice", ingredient_category: "Grains", quantity: 1, unit: "cup" },
      { id: 28, ingredient_name: "Soy Sauce", ingredient_category: "Condiments", quantity: 0.25, unit: "cup" },
      { id: 36, ingredient_name: "Sugar", ingredient_category: "Baking", quantity: 2, unit: "tbsp" },
      { id: 10, ingredient_name: "Garlic", ingredient_category: "Vegetables", quantity: 2, unit: "cloves" },
      { id: 13, ingredient_name: "Broccoli", ingredient_category: "Vegetables", quantity: 2, unit: "cups" },
    ],
  },
  {
    id: 10,
    recipe_name: "Quinoa Buddha Bowl",
    recipe_category: "Healthy",
    meal_type: "Lunch",
    diet_pref: "Vegan",
    total_time: 35,
    servings: 2,
    directions: `1. Cook quinoa according to package directions.
2. Roast chickpeas with spices at 400°F.
3. Prepare vegetables - slice, dice, or roast.
4. Arrange quinoa in bowls.
5. Top with vegetables and chickpeas.
6. Drizzle with tahini dressing.`,
    notes: "Customize with whatever vegetables you have on hand.",
    reference_image_path: "/mock/recipes/placeholder.png",
    banner_image_path: "/mock/recipes/placeholder.png",
    is_favorite: true,
    created_at: "2024-05-15T11:00:00Z",
    ingredients: [
      { id: 21, ingredient_name: "Quinoa", ingredient_category: "Grains", quantity: 1, unit: "cup" },
      { id: 14, ingredient_name: "Spinach", ingredient_category: "Vegetables", quantity: 2, unit: "cups" },
      { id: 15, ingredient_name: "Carrots", ingredient_category: "Vegetables", quantity: 2, unit: "whole" },
      { id: 12, ingredient_name: "Tomato", ingredient_category: "Vegetables", quantity: 1, unit: "cup" },
      { id: 27, ingredient_name: "Olive Oil", ingredient_category: "Oils & Fats", quantity: 2, unit: "tbsp" },
      { id: 42, ingredient_name: "Lime", ingredient_category: "Produce", quantity: 1, unit: "whole" },
    ],
  },
  {
    id: 11,
    recipe_name: "Pork Chops with Apples",
    recipe_category: "American",
    meal_type: "Dinner",
    diet_pref: null,
    total_time: 35,
    servings: 4,
    directions: `1. Season pork chops with salt and pepper.
2. Sear in a hot pan until golden.
3. Remove and set aside.
4. Sauté apples and onions in same pan.
5. Return pork to pan and finish cooking.`,
    notes: "Use a meat thermometer - pork is done at 145°F.",
    reference_image_path: "/mock/recipes/placeholder.png",
    banner_image_path: "/mock/recipes/placeholder.png",
    is_favorite: false,
    created_at: "2024-05-25T18:30:00Z",
    ingredients: [
      { id: 8, ingredient_name: "Pork Chops", ingredient_category: "Protein", quantity: 4, unit: "whole" },
      { id: 9, ingredient_name: "Onion", ingredient_category: "Vegetables", quantity: 1, unit: "whole" },
      { id: 24, ingredient_name: "Butter", ingredient_category: "Dairy", quantity: 2, unit: "tbsp" },
      { id: 29, ingredient_name: "Salt", ingredient_category: "Spices", quantity: 1, unit: "tsp" },
      { id: 30, ingredient_name: "Black Pepper", ingredient_category: "Spices", quantity: 0.5, unit: "tsp" },
    ],
  },
  {
    id: 12,
    recipe_name: "Greek Chicken",
    recipe_category: "Mediterranean",
    meal_type: "Dinner",
    diet_pref: null,
    total_time: 45,
    servings: 4,
    directions: `1. Marinate chicken in olive oil, lemon, and herbs.
2. Let sit for at least 30 minutes.
3. Preheat oven to 425°F.
4. Roast chicken until cooked through.
5. Serve with tzatziki and vegetables.`,
    notes: "Longer marinating time = more flavor.",
    reference_image_path: "/mock/recipes/placeholder.png",
    banner_image_path: "/mock/recipes/placeholder.png",
    is_favorite: false,
    created_at: "2024-06-01T17:00:00Z",
    ingredients: [
      { id: 1, ingredient_name: "Chicken Breast", ingredient_category: "Protein", quantity: 4, unit: "whole" },
      { id: 41, ingredient_name: "Lemon", ingredient_category: "Produce", quantity: 2, unit: "whole" },
      { id: 10, ingredient_name: "Garlic", ingredient_category: "Vegetables", quantity: 4, unit: "cloves" },
      { id: 33, ingredient_name: "Oregano", ingredient_category: "Herbs", quantity: 2, unit: "tsp" },
      { id: 27, ingredient_name: "Olive Oil", ingredient_category: "Oils & Fats", quantity: 4, unit: "tbsp" },
      { id: 29, ingredient_name: "Salt", ingredient_category: "Spices", quantity: 1, unit: "tsp" },
    ],
  },
];

// ============================================================================
// RECIPE CARDS - Lightweight recipe data for lists/cards
// ============================================================================
export const mockRecipeCards: RecipeCardDTO[] = mockRecipes.map((recipe) => ({
  id: recipe.id,
  recipe_name: recipe.recipe_name,
  is_favorite: recipe.is_favorite,
  reference_image_path: recipe.reference_image_path,
  servings: recipe.servings,
  total_time: recipe.total_time,
}));

// ============================================================================
// MEAL SELECTIONS - Meal planning data
// ============================================================================
/**
 * MealSelectionResponseDTO includes full recipe card objects for convenience.
 * This matches the denormalized response from the backend API.
 */
export const mockMealSelections: MealSelectionResponseDTO[] = [
  {
    id: 1,
    meal_name: "Italian Night",
    main_recipe_id: 1,
    side_recipe_1_id: 5,
    side_recipe_2_id: null,
    side_recipe_3_id: null,
    main_recipe: mockRecipeCards.find((r) => r.id === 1) ?? null,
    side_recipe_1: mockRecipeCards.find((r) => r.id === 5) ?? null,
    side_recipe_2: null,
    side_recipe_3: null,
  },
  {
    id: 2,
    meal_name: "Healthy Dinner",
    main_recipe_id: 2,
    side_recipe_1_id: 10,
    side_recipe_2_id: null,
    side_recipe_3_id: null,
    main_recipe: mockRecipeCards.find((r) => r.id === 2) ?? null,
    side_recipe_1: mockRecipeCards.find((r) => r.id === 10) ?? null,
    side_recipe_2: null,
    side_recipe_3: null,
  },
  {
    id: 3,
    meal_name: "Taco Tuesday",
    main_recipe_id: 3,
    side_recipe_1_id: null,
    side_recipe_2_id: null,
    side_recipe_3_id: null,
    main_recipe: mockRecipeCards.find((r) => r.id === 3) ?? null,
    side_recipe_1: null,
    side_recipe_2: null,
    side_recipe_3: null,
  },
  {
    id: 4,
    meal_name: "Quick Weeknight",
    main_recipe_id: 4,
    side_recipe_1_id: null,
    side_recipe_2_id: null,
    side_recipe_3_id: null,
    main_recipe: mockRecipeCards.find((r) => r.id === 4) ?? null,
    side_recipe_1: null,
    side_recipe_2: null,
    side_recipe_3: null,
  },
  {
    id: 5,
    meal_name: "Fancy Friday",
    main_recipe_id: 6,
    side_recipe_1_id: 8,
    side_recipe_2_id: null,
    side_recipe_3_id: null,
    main_recipe: mockRecipeCards.find((r) => r.id === 6) ?? null,
    side_recipe_1: mockRecipeCards.find((r) => r.id === 8) ?? null,
    side_recipe_2: null,
    side_recipe_3: null,
  },
  {
    id: 6,
    meal_name: "Meal Prep Sunday",
    main_recipe_id: 9,
    side_recipe_1_id: null,
    side_recipe_2_id: null,
    side_recipe_3_id: null,
    main_recipe: mockRecipeCards.find((r) => r.id === 9) ?? null,
    side_recipe_1: null,
    side_recipe_2: null,
    side_recipe_3: null,
  },
  {
    id: 7,
    meal_name: "Mediterranean Monday",
    main_recipe_id: 12,
    side_recipe_1_id: 5,
    side_recipe_2_id: null,
    side_recipe_3_id: null,
    main_recipe: mockRecipeCards.find((r) => r.id === 12) ?? null,
    side_recipe_1: mockRecipeCards.find((r) => r.id === 5) ?? null,
    side_recipe_2: null,
    side_recipe_3: null,
  },
];

// ============================================================================
// SHOPPING LIST - Generated from saved meal plans + manual items
// ============================================================================
/**
 * Shopping items use your actual DTO structure:
 * - `category` (not shopping_category)
 * - `have` (not is_checked)
 * - `source` is "recipe" | "manual"
 * - `state_key` for aggregation (null for manual items)
 */
export const mockShoppingItems: ShoppingItemResponseDTO[] = [
  // From Carbonara (Meal 1 - main)
  { id: 1, ingredient_name: "Spaghetti", category: "Pasta", quantity: 1, unit: "lb", have: false, source: "recipe", state_key: "spaghetti_lb" },
  { id: 2, ingredient_name: "Bacon", category: "Protein", quantity: 8, unit: "slices", have: false, source: "recipe", state_key: "bacon_slices" },
  { id: 3, ingredient_name: "Eggs", category: "Protein", quantity: 4, unit: "whole", have: true, source: "recipe", state_key: "eggs_whole" },
  { id: 4, ingredient_name: "Parmesan Cheese", category: "Dairy", quantity: 1, unit: "cup", have: false, source: "recipe", state_key: "parmesan_cheese_cup" },
  { id: 5, ingredient_name: "Black Pepper", category: "Spices", quantity: 1, unit: "tsp", have: true, source: "recipe", state_key: "black_pepper_tsp" },

  // From Caprese Salad (Meal 1 - side)
  { id: 6, ingredient_name: "Tomato", category: "Vegetables", quantity: 4, unit: "whole", have: false, source: "recipe", state_key: "tomato_whole" },
  { id: 7, ingredient_name: "Mozzarella", category: "Dairy", quantity: 8, unit: "oz", have: false, source: "recipe", state_key: "mozzarella_oz" },
  { id: 8, ingredient_name: "Basil", category: "Herbs", quantity: 0.5, unit: "cup", have: false, source: "recipe", state_key: "basil_cup" },
  { id: 9, ingredient_name: "Olive Oil", category: "Oils & Fats", quantity: 4, unit: "tbsp", have: true, source: "recipe", state_key: "olive_oil_tbsp" },
  { id: 10, ingredient_name: "Salt", category: "Spices", quantity: 0.5, unit: "tsp", have: true, source: "recipe", state_key: "salt_tsp" },

  // From Honey Garlic Salmon (Meal 2 - main)
  { id: 11, ingredient_name: "Salmon Fillet", category: "Protein", quantity: 2, unit: "fillets", have: false, source: "recipe", state_key: "salmon_fillet_fillets" },
  { id: 12, ingredient_name: "Sugar", category: "Baking", quantity: 0.25, unit: "cup", have: true, source: "recipe", state_key: "sugar_cup" },
  { id: 13, ingredient_name: "Soy Sauce", category: "Condiments", quantity: 3, unit: "tbsp", have: false, source: "recipe", state_key: "soy_sauce_tbsp" },
  { id: 14, ingredient_name: "Garlic", category: "Vegetables", quantity: 3, unit: "cloves", have: false, source: "recipe", state_key: "garlic_cloves" },
  { id: 15, ingredient_name: "Lemon", category: "Produce", quantity: 1, unit: "whole", have: false, source: "recipe", state_key: "lemon_whole" },

  // From Quinoa Buddha Bowl (Meal 2 - side)
  { id: 16, ingredient_name: "Quinoa", category: "Grains", quantity: 1, unit: "cup", have: false, source: "recipe", state_key: "quinoa_cup" },
  { id: 17, ingredient_name: "Spinach", category: "Vegetables", quantity: 2, unit: "cups", have: false, source: "recipe", state_key: "spinach_cups" },
  { id: 18, ingredient_name: "Carrots", category: "Vegetables", quantity: 2, unit: "whole", have: false, source: "recipe", state_key: "carrots_whole" },
  { id: 19, ingredient_name: "Lime", category: "Produce", quantity: 1, unit: "whole", have: false, source: "recipe", state_key: "lime_whole" },

  // Manual items (added by user)
  { id: 20, ingredient_name: "Milk", category: "Dairy", quantity: 1, unit: "gallon", have: false, source: "manual", state_key: null },
  { id: 21, ingredient_name: "Bread", category: "Bread", quantity: 1, unit: "loaf", have: true, source: "manual", state_key: null },
  { id: 22, ingredient_name: "Coffee", category: "Beverages", quantity: 1, unit: "bag", have: false, source: "manual", state_key: null },
  { id: 23, ingredient_name: "Paper Towels", category: "Household", quantity: 2, unit: "rolls", have: false, source: "manual", state_key: null },
  { id: 24, ingredient_name: "Bananas", category: "Produce", quantity: 1, unit: "bunch", have: false, source: "manual", state_key: null },
];

// Compute summary values for the shopping list
const checkedCount = mockShoppingItems.filter((item) => item.have).length;
const recipeCount = mockShoppingItems.filter((item) => item.source === "recipe").length;
const manualCount = mockShoppingItems.filter((item) => item.source === "manual").length;
const uniqueCategories = [...new Set(mockShoppingItems.map((item) => item.category).filter(Boolean))] as string[];

export const mockShoppingList: ShoppingListResponseDTO = {
  items: mockShoppingItems,
  total_items: mockShoppingItems.length,
  checked_items: checkedCount,
  recipe_items: recipeCount,
  manual_items: manualCount,
  categories: uniqueCategories,
};

// ============================================================================
// CONSTANTS - For dropdowns and filters
// ============================================================================
export const RECIPE_CATEGORIES = [
  "Pasta",
  "Seafood",
  "Mexican",
  "Asian",
  "Salad",
  "Italian",
  "Healthy",
  "American",
  "Mediterranean",
] as const;

export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Side", "Snack", "Dessert"] as const;

export const DIET_PREFERENCES = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Paleo",
] as const;

export const INGREDIENT_CATEGORIES = [
  "Protein",
  "Vegetables",
  "Pasta",
  "Grains",
  "Dairy",
  "Oils & Fats",
  "Condiments",
  "Spices",
  "Herbs",
  "Baking",
  "Pantry",
  "Bread",
  "Produce",
] as const;

export const SHOPPING_CATEGORIES = [
  "Protein",
  "Vegetables",
  "Dairy",
  "Pasta",
  "Grains",
  "Oils & Fats",
  "Condiments",
  "Spices",
  "Herbs",
  "Baking",
  "Pantry",
  "Bread",
  "Produce",
  "Beverages",
  "Household",
] as const;

export const UNITS = [
  "whole",
  "lb",
  "oz",
  "cup",
  "cups",
  "tbsp",
  "tsp",
  "cloves",
  "slices",
  "fillets",
  "gallon",
  "loaf",
  "bag",
  "rolls",
  "bunch",
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getMockRecipeById(id: number): RecipeResponseDTO | undefined {
  return mockRecipes.find((recipe) => recipe.id === id);
}

export function getMockRecipesByCategory(category: string): RecipeResponseDTO[] {
  return mockRecipes.filter((recipe) => recipe.recipe_category === category);
}

export function getMockFavoriteRecipes(): RecipeResponseDTO[] {
  return mockRecipes.filter((recipe) => recipe.is_favorite);
}

export function getMockRecipesByMealType(mealType: string): RecipeResponseDTO[] {
  return mockRecipes.filter((recipe) => recipe.meal_type === mealType);
}

export function searchMockRecipes(query: string): RecipeResponseDTO[] {
  const lowerQuery = query.toLowerCase();
  return mockRecipes.filter(
    (recipe) =>
      recipe.recipe_name.toLowerCase().includes(lowerQuery) ||
      recipe.recipe_category.toLowerCase().includes(lowerQuery) ||
      recipe.ingredients.some((ing) =>
        ing.ingredient_name.toLowerCase().includes(lowerQuery)
      )
  );
}

export function getMockShoppingItemsByCategory(category: string): ShoppingItemResponseDTO[] {
  return mockShoppingItems.filter((item) => item.category === category);
}

export function getMockUncheckedShoppingItems(): ShoppingItemResponseDTO[] {
  return mockShoppingItems.filter((item) => !item.have);
}

export function getMockRecipeShoppingItems(): ShoppingItemResponseDTO[] {
  return mockShoppingItems.filter((item) => item.source === "recipe");
}

export function getMockManualShoppingItems(): ShoppingItemResponseDTO[] {
  return mockShoppingItems.filter((item) => item.source === "manual");
}