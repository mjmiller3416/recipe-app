"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { recipeApi } from "@/lib/api";
import type { RecipeResponseDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageLayout } from "@/components/layout/PageLayout";
import {
  useRecipeForm,
  RecipeInfoCard,
  IngredientsCard,
  DirectionsNotesCard,
  ImageUploadCard,
} from "@/components/add-recipe";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

// ============================================================================
// LOADING SKELETON
// ============================================================================

function EditRecipeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="h-8 w-48 bg-hover rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="h-10 bg-hover rounded animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-hover rounded animate-pulse" />
                    <div className="h-10 bg-hover rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-10 bg-hover rounded animate-pulse" />
                    <div className="h-10 bg-hover rounded animate-pulse" />
                    <div className="h-10 bg-hover rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = Number(params.id);

  // Fetch the existing recipe data
  const [initialData, setInitialData] = useState<RecipeResponseDTO | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function fetchRecipe() {
      try {
        const recipe = await recipeApi.get(recipeId);
        setInitialData(recipe);
      } catch (error) {
        console.error("Failed to fetch recipe:", error);
        toast.error("Failed to load recipe");
        setFetchError(true);
        router.push("/recipes");
      }
    }
    fetchRecipe();
  }, [recipeId, router]);

  // Use the unified recipe form hook in edit mode
  const form = useRecipeForm({
    mode: 'edit',
    recipeId,
    initialData,
  });

  // Use the unsaved changes hook for navigation guards
  const {
    showLeaveDialog,
    setShowLeaveDialog,
    handleNavigation,
    confirmLeave,
    cancelLeave,
  } = useUnsavedChanges({
    isDirty: form.isDirty,
    onConfirmLeave: () => {
      // Reset dirty state when user confirms leaving
    },
  });

  // Show loading skeleton while fetching initial data
  if (!initialData || form.isLoading) {
    return <EditRecipeSkeleton />;
  }

  // Handle fetch error (redirect already triggered)
  if (fetchError) {
    return null;
  }

  return (
    <>
      <PageLayout
        title="Edit Recipe"
        description={`Editing "${initialData.recipe_name}"`}
        onBackClick={() => handleNavigation(`/recipes/${recipeId}`)}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={form.handleSubmit}
            disabled={form.isSubmitting}
          >
            {form.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {form.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        }
      >
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

          {/* Right Column - Image Upload */}
          <div className="lg:col-span-1">
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

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-secondary" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLeave}>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave} className="bg-secondary hover:bg-secondary/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
