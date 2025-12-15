"use client";

import { useState } from "react";
import { RecipeCard, RecipeCardGrid } from "@/components/RecipeCard";  // ← Component only
import type { RecipeCardData } from "@/types";  // ← Types from types!
import { Separator } from "@/components/ui/separator";
import { mockRecipes } from "@/lib/mockData";
import { mapRecipesForCards } from "@/lib/recipeCardMapper";  

export default function RecipeCardDemo() {
  // Convert your backend-structured mockData to RecipeCardData format
  const initialRecipes = mapRecipesForCards(mockRecipes);
  const [recipes, setRecipes] = useState<RecipeCardData[]>(initialRecipes);

  const handleRecipeClick = (recipe: RecipeCardData) => {
    console.log("Recipe clicked:", recipe);
    // In production: router.push(`/recipes/${recipe.id}`)
  };

  const handleFavoriteToggle = (recipe: RecipeCardData) => {
    // Optimistic update
    setRecipes(prev => 
      prev.map(r => 
        r.id === recipe.id 
          ? { ...r, isFavorite: !r.isFavorite }
          : r
      )
    );
    
    console.log(`Toggled favorite for: ${recipe.name}`);
    // In production: await fetch(`/api/recipes/${recipe.id}/favorite`, { method: 'POST' })
  };

  const favoriteRecipes = recipes.filter(r => r.isFavorite);
  const recipesWithIngredients = recipes.filter(r => r.ingredients && r.ingredients.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Recipe Cards Demo</h1>
              <p className="text-sm text-muted mt-0.5">
                Using your actual mockData.ts • Ready for backend integration
              </p>
            </div>
            <div className="text-sm text-muted">
              <span className="font-medium text-primary">{favoriteRecipes.length}</span> favorites
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-primary mt-0.5">ℹ️</div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">Using Your Mock Data</h3>
              <p className="text-xs text-muted mt-1">
                This demo uses <code className="bg-background px-1.5 py-0.5 rounded">lib/mockData.ts</code> with 
                the <code className="bg-background px-1.5 py-0.5 rounded">recipeCardMapper</code>. 
                When you connect your backend, just swap <code className="bg-background px-1.5 py-0.5 rounded">mockRecipes</code> with 
                your API fetch - the mapper handles both!
              </p>
            </div>
          </div>
        </div>

        {/* LARGE CARDS - Traditional Recipe Card Style */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Large Cards</h2>
            <p className="text-sm text-muted">
              Traditional recipe card with full ingredients • {recipesWithIngredients.length} recipes have ingredient data
            </p>
          </div>
          
          <RecipeCardGrid size="large">
            {recipesWithIngredients.slice(0, 3).map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                size="large"
                onClick={handleRecipeClick}
                onFavoriteToggle={handleFavoriteToggle}
                maxIngredientsDisplay={8}
              />
            ))}
          </RecipeCardGrid>

          {/* Show more if available */}
          {recipesWithIngredients.length > 3 && (
            <>
              <Separator />
              <RecipeCardGrid size="large">
                {recipesWithIngredients.slice(3, 6).map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    size="large"
                    onClick={handleRecipeClick}
                    onFavoriteToggle={handleFavoriteToggle}
                    maxIngredientsDisplay={6}
                  />
                ))}
              </RecipeCardGrid>
            </>
          )}
        </section>

        <Separator />

        {/* MEDIUM CARDS - Recipe Browser Standard */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Medium Cards</h2>
            <p className="text-sm text-muted">
              Perfect for Recipe Browser page • All {recipes.length} recipes from your mockData
            </p>
          </div>
          
          <RecipeCardGrid size="medium">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                size="medium"
                onClick={handleRecipeClick}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </RecipeCardGrid>
        </section>

        <Separator />

        {/* SMALL CARDS - Compact List */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Small Cards</h2>
            <p className="text-sm text-muted">
              Compact layout for Meal Planner
            </p>
          </div>
          
          <div className="max-w-2xl">
            <RecipeCardGrid size="small">
              {recipes.slice(0, 6).map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  size="small"
                  onClick={handleRecipeClick}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </RecipeCardGrid>
          </div>
        </section>

        <Separator />

        {/* FAVORITES ONLY */}
        {favoriteRecipes.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Your Favorites</h2>
              <p className="text-sm text-muted">
                Recipes marked as favorite in mockData
              </p>
            </div>
            
            <RecipeCardGrid size="medium">
              {favoriteRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  size="medium"
                  onClick={handleRecipeClick}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </RecipeCardGrid>
          </section>
        )}

        <Separator />

        {/* INTEGRATION GUIDE */}
        <section className="space-y-4 bg-elevated p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-foreground">Backend Integration Guide</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-foreground mb-2">Current Setup (Mock Data)</h3>
              <pre className="bg-background p-4 rounded-lg overflow-x-auto text-xs">
                <code className="text-primary">{`import { mockRecipes } from "@/lib/mockData";
import { mapRecipesForCards } from "@/lib/recipeCardMapper";

const recipes = mapRecipesForCards(mockRecipes);`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-foreground mb-2">Future Setup (Real Backend)</h3>
              <pre className="bg-background p-4 rounded-lg overflow-x-auto text-xs">
                <code className="text-primary">{`import { mapRecipesForCards } from "@/lib/recipeCardMapper";

const response = await fetch('/api/recipes');
const data: RecipeResponseDTO[] = await response.json();
const recipes = mapRecipesForCards(data);  // Same mapper!`}</code>
              </pre>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="font-medium text-foreground mb-2">Why This Works</h3>
              <ul className="text-muted space-y-1 text-xs">
                <li>✅ <code className="bg-background px-1 py-0.5 rounded">mockData.ts</code> uses your actual DTO structure</li>
                <li>✅ <code className="bg-background px-1 py-0.5 rounded">recipeCardMapper.ts</code> converts DTOs → RecipeCardData</li>
                <li>✅ Same mapper works for both mock and real API data</li>
                <li>✅ When backend is ready, just change data source - no component changes!</li>
                <li>✅ Type safety ensures backend structure matches expectations</li>
              </ul>
            </div>
          </div>
        </section>

        {/* DATA INSPECTION */}
        <section className="space-y-4 bg-elevated p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-foreground">Mock Data Stats</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted text-xs">Total Recipes</p>
              <p className="text-2xl font-semibold text-foreground">{recipes.length}</p>
            </div>
            <div>
              <p className="text-muted text-xs">With Ingredients</p>
              <p className="text-2xl font-semibold text-foreground">{recipesWithIngredients.length}</p>
            </div>
            <div>
              <p className="text-muted text-xs">Favorites</p>
              <p className="text-2xl font-semibold text-foreground">{favoriteRecipes.length}</p>
            </div>
            <div>
              <p className="text-muted text-xs">Categories</p>
              <p className="text-2xl font-semibold text-foreground">
                {new Set(recipes.map(r => r.category)).size}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted">
              All data from <code className="bg-background px-1 py-0.5 rounded">lib/mockData.ts</code> • 
              Structure matches <code className="bg-background px-1 py-0.5 rounded">RecipeResponseDTO</code> from your backend
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}