"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Lightbulb, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { RecipeHeroImage } from "@/components/recipe/RecipeImage";
import type { RecipeResponseDTO } from "@/types";

import { sortCategoryEntries } from "./recipe-utils";
import { useRecipeView } from "./useRecipeView";
import { RecipeSkeleton } from "./RecipeSkeleton";
import { RecipeNotFound } from "./RecipeNotFound";
import { RecipeHeaderCard } from "./RecipeHeaderCard";
import { IngredientItem } from "./IngredientItem";
import { DirectionStep } from "./DirectionStep";
import { AddToMealPlanDialog } from "./AddToMealPlanDialog";
import { PrintPreviewDialog, RecipePrintLayout, usePrintRecipe } from "./print";

// ============================================================================
// MAIN VIEW COMPONENT
// ============================================================================

export function FullRecipeView() {
  const params = useParams();
  const router = useRouter();
  const recipeId = Number(params.id);

  // Recipe data and handlers from custom hook
  const {
    recipe,
    loading,
    isFavorite,
    plannerEntries,
    directions,
    groupedIngredients,
    checkedIngredients,
    completedSteps,
    ingredientProgress,
    stepProgress,
    handleFavoriteToggle,
    handleIngredientToggle,
    handleStepToggle,
    handleDelete,
    handleMealAdded,
  } = useRecipeView(recipeId);

  // Print functionality from custom hook
  const { printDialogOpen, setPrintDialogOpen, printOptions, handlePrint } = usePrintRecipe();

  // Local state for meal plan dialog
  const [mealPlanDialogOpen, setMealPlanDialogOpen] = useState(false);

  // Share handler - copies URL to clipboard
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  // Loading state
  if (loading) {
    return <RecipeSkeleton />;
  }

  // Not found state
  if (!recipe) {
    return <RecipeNotFound />;
  }

  return (
    <>
      <div className="min-h-screen bg-background print:bg-white">
        {/* Print-Only Layout */}
        <RecipePrintLayout
          recipe={recipe}
          directions={directions}
          groupedIngredients={groupedIngredients}
          printOptions={printOptions}
        />

        {/* Hero Image Section - Hidden for Print */}
        <div className="print:hidden">
          <RecipeHeroImage
            src={recipe.reference_image_path}
            alt={recipe.recipe_name}
          >
            {/* Back Button - Fixed Position */}
            <div className="absolute top-6 left-6">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>

            {/* Favorite Button - Fixed Position */}
            <div className="absolute top-6 right-6">
              <FavoriteButton
                isFavorite={isFavorite}
                onToggle={handleFavoriteToggle}
                variant="overlay"
                size="lg"
              />
            </div>
          </RecipeHeroImage>
        </div>

        {/* Main Content - Hidden for Print */}
        <div className="relative z-10 max-w-5xl px-6 pb-12 mx-auto -mt-16 print:hidden">
          {/* Recipe Header Card */}
          <RecipeHeaderCard
            recipe={recipe}
            recipeId={recipeId}
            onMealPlanClick={() => setMealPlanDialogOpen(true)}
            onPrintClick={() => setPrintDialogOpen(true)}
            onShare={handleShare}
            onDelete={handleDelete}
          />

          {/* Two Column Layout: Ingredients & Directions */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 print:block print:space-y-6">
            {/* Ingredients Column */}
            <div className="lg:col-span-4 print:w-full">
              <Card className="sticky top-6 print:static print:shadow-none print:border print:border-gray-200">
                <CardContent className="p-6 print:p-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 print:mb-2">
                    <div className="flex items-center gap-3 print:gap-0">
                      <div className="p-2 rounded-lg bg-secondary/10 print:hidden">
                        <BookOpen className="w-5 h-5 text-secondary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground print:text-lg print:text-black">
                        Ingredients
                      </h2>
                    </div>
                    {ingredientProgress > 0 && (
                      <span className="text-sm text-muted-foreground print:hidden">
                        {ingredientProgress}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {ingredientProgress > 0 && (
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden mb-4 print:hidden">
                      <div
                        className="h-full transition-all duration-300 bg-secondary"
                        style={{ width: `${ingredientProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Ingredients List */}
                  {recipe.ingredients.length > 0 ? (
                    <div className="space-y-1">
                      {sortCategoryEntries(Array.from(groupedIngredients.entries())).map(([category, ingredients]) => (
                        <div key={category}>
                          {groupedIngredients.size > 1 && (
                            <p className="mt-4 mb-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground first:mt-0">
                              {category}
                            </p>
                          )}
                          {ingredients.map((ingredient: RecipeResponseDTO["ingredients"][0]) => (
                            <IngredientItem
                              key={ingredient.id}
                              ingredient={ingredient}
                              checked={checkedIngredients.has(ingredient.id)}
                              onToggle={() => handleIngredientToggle(ingredient.id)}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">
                      No ingredients listed
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Directions Column */}
            <div className="lg:col-span-8 print:w-full">
              <Card className="print:shadow-none print:border print:border-gray-200">
                <CardContent className="p-6 print:p-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 print:mb-2">
                    <div className="flex items-center gap-3 print:gap-0">
                      <div className="p-2 rounded-lg bg-primary/10 print:hidden">
                        <UtensilsCrossed className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground print:text-lg print:text-black">
                        Directions
                      </h2>
                    </div>
                    {stepProgress > 0 && (
                      <span className="text-sm text-muted-foreground print:hidden">
                        {stepProgress}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {stepProgress > 0 && (
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden mb-4 print:hidden">
                      <div
                        className="h-full transition-all duration-300 bg-primary"
                        style={{ width: `${stepProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Directions Steps */}
                  {directions.length > 0 ? (
                    <div className="space-y-2">
                      {directions.map((step, index) => (
                        <DirectionStep
                          key={index}
                          step={step}
                          index={index}
                          completed={completedSteps.has(index)}
                          onToggle={() => handleStepToggle(index)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">
                      No directions available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Notes Section */}
              {recipe.notes && (
                <Card className="mt-8 border-warning/30 bg-warning/5 print:mt-4 print:border print:border-gray-300 print:bg-gray-50 print:shadow-none">
                  <CardContent className="p-6 print:p-4">
                    <div className="flex items-start gap-4 print:gap-2">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-warning/20 print:hidden">
                        <Lightbulb className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-bold text-foreground print:text-base print:text-black print:mb-1">
                          Chef's Notes
                        </h3>
                        <p className="leading-relaxed text-foreground/80 print:text-sm print:text-black">
                          {recipe.notes}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add to Meal Plan Dialog */}
      <AddToMealPlanDialog
        recipe={recipe}
        plannerEntries={plannerEntries}
        open={mealPlanDialogOpen}
        onOpenChange={setMealPlanDialogOpen}
        onSuccess={handleMealAdded}
      />

      {/* Print Preview Dialog */}
      <PrintPreviewDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        onPrint={handlePrint}
        hasImage={!!recipe.reference_image_path}
        hasNotes={!!recipe.notes}
      />
    </>
  );
}