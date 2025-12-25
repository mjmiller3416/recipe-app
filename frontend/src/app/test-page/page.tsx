"use client";

import { useEffect, useState } from "react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { SideDishSlots } from "@/app/meal-planner/_components/meal-display/SideDishSlots";
import { MainDishCard } from "@/app/meal-planner/_components/meal-display/MainDishCard";
import { MealSelection } from "@/app/meal-planner/_components/meal-display/MealSelection";
import { recipeApi } from "@/lib/api";
import type { RecipeCardData, RecipeResponseDTO } from "@/types";

// Map backend DTO to frontend RecipeCardData format
function mapToCardData(recipe: RecipeResponseDTO): RecipeCardData {
  return {
    id: recipe.id,
    name: recipe.recipe_name,
    servings: recipe.servings ?? 1,
    totalTime: recipe.total_time ?? 0,
    imageUrl: recipe.reference_image_path ?? undefined,
    category: recipe.recipe_category,
    mealType: recipe.meal_type,
    dietaryPreference: recipe.diet_pref ?? undefined,
    isFavorite: recipe.is_favorite,
  };
}

export default function TestPage() {
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecipes() {
      try {
        const data = await recipeApi.list({ limit: 3 });
        setRecipes(data.map(mapToCardData));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch recipes");
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
  }, []);

  const handleFilledSlotClick = (recipe: RecipeCardData, index: number) => {
    console.log(`Filled slot ${index} clicked - Recipe: ${recipe.name}`);
  };

  const handleEmptySlotClick = (index: number) => {
    console.log(`Empty slot ${index} clicked`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Test Page</h1>
          <p className="text-muted-foreground">
            Component Testing
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <p className="text-center text-muted-foreground">Loading recipes...</p>
        )}

        {/* Error State */}
        {error && (
          <p className="text-center text-destructive">{error}</p>
        )}

        {!loading && !error && (
          <>
            {/* MealSelection - Full meal display with data fetching */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">MealSelection (Meal ID: 10)</h2>
              <p className="text-sm text-muted-foreground">Click main dish or side dishes to navigate to recipe detail</p>
              <MealSelection mealId={10} />
            </section>

            {/* MainDishCard - Hero card for main dish */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">MainDishCard</h2>
              {recipes[0] && (
                <MainDishCard
                  name={recipes[0].name}
                  imageUrl={recipes[0].imageUrl}
                  servings={recipes[0].servings}
                  totalTime={recipes[0].totalTime}
                  category={recipes[0].category}
                  mealType={recipes[0].mealType}
                  dietaryPreference={recipes[0].dietaryPreference}
                  onClick={() => console.log("MainDishCard clicked")}
                />
              )}
            </section>

            {/* MainDishCard - No image (placeholder) */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">MainDishCard (No Image)</h2>
              <MainDishCard
                name="Recipe Without Image"
                servings={4}
                totalTime={45}
                category="Italian"
                mealType="Dinner"
              />
            </section>

            {/* SideDishSlots - All filled */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">SideDishSlots (All Filled)</h2>
              <SideDishSlots
                recipes={recipes}
                onFilledSlotClick={handleFilledSlotClick}
                onEmptySlotClick={handleEmptySlotClick}
              />
            </section>

            {/* SideDishSlots - Partially filled (1 recipe, 2 empty) */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">SideDishSlots (1 Filled, 2 Empty)</h2>
              <SideDishSlots
                recipes={[recipes[0], null, null]}
                onFilledSlotClick={handleFilledSlotClick}
                onEmptySlotClick={handleEmptySlotClick}
              />
            </section>

            {/* SideDishSlots - All empty (disabled) */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">SideDishSlots (All Empty - Disabled)</h2>
              <SideDishSlots
                recipes={[]}
              />
            </section>

            {/* Original RecipeCard small for comparison */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">RecipeCard Small (Original)</h2>
              {recipes.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {recipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      size="small"
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}