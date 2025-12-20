"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
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
    <PageLayout
      title="Add New Recipe"
      description="Create a new recipe for your collection"
      fixedViewport
      actions={
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
      }
    >
      <div className="flex gap-6 h-full">
        {/* Left Column - Form Cards (scrolls) */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-6">
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
            availableIngredients={form.availableIngredients}
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

        {/* Right Column - Image Upload (fixed, doesn't scroll) */}
        <div className="w-80 flex-shrink-0">
          <ImageUploadCard
            imagePreview={form.imagePreview}
            onImageUpload={form.handleImageUpload}
            onGeneratedImageAccept={form.handleGeneratedImageAccept}
            recipeName={form.recipeName}
            isAiGenerated={form.isAiGenerated}
            onAiGeneratedChange={form.setIsAiGenerated}
          />
        </div>
      </div>
    </PageLayout>
  );
}
