"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { recipeApi } from "@/lib/api";
import type { RecipeResponseDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useRecipeForm } from "./useRecipeForm";
import { RecipeInfoCard } from "./RecipeInfoCard";
import { IngredientsCard } from "./IngredientsCard";
import { DirectionsNotesCard } from "./DirectionsNotesCard";
import { ImageUploadCard } from "./ImageUploadCard";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

// ============================================================================
// TYPES
// ============================================================================

interface AddEditRecipeViewProps {
  mode: "add" | "edit";
  recipeId?: number;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function EditRecipeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <Skeleton className="w-48 h-8" />
        </div>
      </div>
      <div className="px-6 py-8 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="w-full h-10" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-10" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-10" />
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
// MAIN VIEW COMPONENT
// ============================================================================

export function AddEditRecipeView({ mode, recipeId }: AddEditRecipeViewProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  // State for edit mode - fetch existing recipe data
  const [initialData, setInitialData] = useState<RecipeResponseDTO | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  // Fetch recipe data for edit mode
  useEffect(() => {
    if (!isEditMode || !recipeId) {
      setIsFetching(false);
      return;
    }

    async function fetchRecipe() {
      try {
        const recipe = await recipeApi.get(recipeId!);
        setInitialData(recipe);
      } catch (error) {
        console.error("Failed to fetch recipe:", error);
        toast.error("Failed to load recipe");
        setFetchError(true);
        router.push("/recipes");
      } finally {
        setIsFetching(false);
      }
    }
    fetchRecipe();
  }, [recipeId, isEditMode, router]);

  // Use the unified recipe form hook
  const form = useRecipeForm(
    isEditMode
      ? { mode: "edit", recipeId: recipeId!, initialData }
      : undefined
  );

  // Unsaved changes hook (only active in edit mode)
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

  // Show loading skeleton while fetching initial data (edit mode only)
  if (isFetching || (isEditMode && (!initialData || form.isLoading))) {
    return <EditRecipeSkeleton />;
  }

  // Handle fetch error (redirect already triggered)
  if (fetchError) {
    return null;
  }

  // Page metadata
  const pageTitle = isEditMode ? "Edit Recipe" : "Add New Recipe";
  const pageDescription = isEditMode
    ? `Editing "${initialData?.recipe_name}"`
    : "Create a new recipe for your collection";
  const saveButtonText = isEditMode ? "Save Changes" : "Save Recipe";

  return (
    <>
      <PageLayout
        title={pageTitle}
        description={pageDescription}
        onBackClick={isEditMode ? () => handleNavigation(`/recipes/${recipeId}`) : undefined}
        contentClassName="max-md:pb-40"
        actions={
          <Button
            variant="default"
            className="hidden gap-2 md:flex"
            onClick={form.handleSubmit}
            disabled={form.isSubmitting}
          >
            {form.isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {form.isSubmitting ? "Saving..." : saveButtonText}
          </Button>
        }
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Form Cards - Top on mobile, left column on desktop */}
          <div className="flex-1 min-w-0 space-y-6">
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
              autoFocusName={!isEditMode}
            />

            {/* Ingredients Section */}
            <IngredientsCard
              ingredients={form.ingredients}
              availableIngredients={form.availableIngredients}
              onUpdate={form.updateIngredient}
              onDelete={form.deleteIngredient}
              onAdd={form.addIngredient}
              onReorder={form.reorderIngredients}
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

          {/* Image Upload - Bottom on mobile, right sidebar on desktop */}
          {/* Image Upload - Bottom on mobile, right sidebar on desktop */}
          <div className="md:w-80 md:flex-shrink-0 md:self-stretch">
            <div className="md:sticky md:top-[113px] z-10 transform-gpu">
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
        </div>
      </PageLayout>

      {/* Mobile Fixed Save Button - positioned above bottom nav */}
      <div className="fixed left-0 right-0 z-40 p-4 border-t md:hidden bottom-16 bg-sidebar border-border">
        <Button
          variant="default"
          className="w-full gap-2"
          onClick={form.handleSubmit}
          disabled={form.isSubmitting}
        >
          {form.isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {form.isSubmitting ? "Saving..." : saveButtonText}
        </Button>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-secondary" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLeave}>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave} className="text-white bg-destructive hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
