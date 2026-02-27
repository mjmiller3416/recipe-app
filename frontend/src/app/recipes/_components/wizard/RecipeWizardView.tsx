"use client";

import { useCallback } from "react";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useRecipeWizard } from "./useRecipeWizard";
import {
  MethodSelectionStep,
  RecipeBasicsStep,
  IngredientsStep,
  DirectionsNotesStep,
  NutritionStep,
} from "./steps";

// ============================================================================
// Constants
// ============================================================================

const STEP_LABELS = [
  "Method",
  "Basics",
  "Ingredients",
  "Directions",
  "Finish",
];

const TOTAL_STEPS = 5;

// ============================================================================
// Props
// ============================================================================

interface RecipeWizardViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// RecipeWizardView
// ============================================================================

export function RecipeWizardView({ open, onOpenChange }: RecipeWizardViewProps) {
  const wizard = useRecipeWizard();

  const progressPercent = ((wizard.currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="xl"
        className="max-h-[90vh] flex flex-col gap-0 overflow-hidden"
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 space-y-4">
          <DialogHeader className="text-center sm:text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Create New Recipe
            </p>
            <DialogTitle className="text-xl">Add New Recipe</DialogTitle>
            <DialogDescription>
              Step {wizard.currentStep} of {TOTAL_STEPS} —{" "}
              {STEP_LABELS[wizard.currentStep - 1]}
            </DialogDescription>
          </DialogHeader>

          {/* Progress bar */}
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        <Separator />

        {/* ── Scrollable step content ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {wizard.currentStep === 1 && (
            <MethodSelectionStep
              selectedMethod={wizard.creationMethod}
              onSelect={wizard.setCreationMethod}
            />
          )}

          {wizard.currentStep === 2 && (
            <RecipeBasicsStep
              recipeName={wizard.recipeName}
              setRecipeName={wizard.setRecipeName}
              description={wizard.description}
              setDescription={wizard.setDescription}
              prepTime={wizard.prepTime}
              setPrepTime={wizard.setPrepTime}
              cookTime={wizard.cookTime}
              setCookTime={wizard.setCookTime}
              servings={wizard.servings}
              setServings={wizard.setServings}
              difficulty={wizard.difficulty}
              setDifficulty={wizard.setDifficulty}
              mealType={wizard.mealType}
              setMealType={wizard.setMealType}
              category={wizard.category}
              setCategory={wizard.setCategory}
              dietaryPreference={wizard.dietaryPreference}
              setDietaryPreference={wizard.setDietaryPreference}
              hasError={wizard.hasError}
              getError={wizard.getError}
            />
          )}

          {wizard.currentStep === 3 && (
            <IngredientsStep
              ingredients={wizard.ingredients}
              availableIngredients={wizard.availableIngredients}
              onAdd={wizard.addIngredient}
              onUpdate={wizard.updateIngredient}
              onDelete={wizard.deleteIngredient}
              onReorder={wizard.reorderIngredients}
              onClearAll={wizard.clearAllIngredients}
              hasError={wizard.hasError}
              getError={wizard.getError}
              getIngredientError={wizard.getIngredientError}
            />
          )}

          {wizard.currentStep === 4 && (
            <DirectionsNotesStep
              directions={wizard.directions}
              notes={wizard.notes}
              setNotes={wizard.setNotes}
              onAddDirection={wizard.addDirection}
              onUpdateDirection={wizard.updateDirection}
              onDeleteDirection={wizard.deleteDirection}
              onReorderDirections={wizard.reorderDirections}
              hasError={wizard.hasError}
              getError={wizard.getError}
            />
          )}

          {wizard.currentStep === 5 && (
            <NutritionStep
              recipeName={wizard.recipeName}
              imagePreview={wizard.imagePreview}
              isAiGenerated={wizard.isAiGenerated}
              setIsAiGenerated={() => {
                // Read-only in this context — handled by image generation flow
              }}
              onImageUpload={wizard.handleImageUpload}
              onGeneratedImageAccept={wizard.handleGeneratedImageAccept}
              onBannerOnlyAccept={wizard.handleBannerOnlyAccept}
              generatedRefData={wizard.generatedRefData}
              generatedBannerData={wizard.generatedBannerData}
            />
          )}
        </div>

        <Separator />

        {/* ── Footer navigation ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Cancel / Back */}
          <div>
            {wizard.currentStep === 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={wizard.prevStep}
                disabled={wizard.isSubmitting}
              >
                <ArrowLeft className="size-4 mr-2" strokeWidth={1.5} />
                Back
              </Button>
            )}
          </div>

          {/* Right: Next / Save */}
          <div>
            {wizard.currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={wizard.nextStep}
                disabled={!wizard.canProceed}
              >
                Next Step
                <ArrowRight className="size-4 ml-2" strokeWidth={1.5} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={wizard.handleSubmit}
                disabled={wizard.isSubmitting}
              >
                {wizard.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" strokeWidth={1.5} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" strokeWidth={1.5} />
                    Save Recipe
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
