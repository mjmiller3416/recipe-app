"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
} from "@/components/layout/PageHeader";
import {
  useRecipeForm,
  RecipeInfoCard,
  IngredientsCard,
  DirectionsNotesCard,
  ImageUploadCard,
} from "@/components/add-recipe";

export default function AddRecipePage() {
  const form = useRecipeForm();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle
            title="Add New Recipe"
            description="Create a new recipe for your collection"
          />
          <PageHeaderActions>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={form.handleSubmit}
              disabled={form.isSubmitting}
            >
              <Save className="h-4 w-4" />
              {form.isSubmitting ? "Saving..." : "Save Recipe"}
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipe Info Section */}
            <RecipeInfoCard
              recipeName={form.recipeName}
              setRecipeName={form.setRecipeName}
              totalTime={form.totalTime}
              setTotalTime={form.setTotalTime}
              servings={form.servings}
              setServings={form.setServings}
              mealType={form.mealType}
              setMealType={form.setMealType}
              category={form.category}
              setCategory={form.setCategory}
              dietaryPreference={form.dietaryPreference}
              setDietaryPreference={form.setDietaryPreference}
              hasError={form.hasError}
              getError={form.getError}
            />

            {/* Ingredients Section */}
            <IngredientsCard
              ingredients={form.ingredients}
              onUpdate={form.updateIngredient}
              onDelete={form.deleteIngredient}
              onAdd={form.addIngredient}
              getError={form.getError}
            />

            {/* Directions & Notes Section */}
            <DirectionsNotesCard
              directions={form.directions}
              setDirections={form.setDirections}
              notes={form.notes}
              setNotes={form.setNotes}
              hasError={form.hasError}
              getError={form.getError}
            />
          </div>

          {/* Right Column - Image Upload */}
          <div className="lg:col-span-1">
            <ImageUploadCard
              imagePreview={form.imagePreview}
              onImageUpload={form.handleImageUpload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
