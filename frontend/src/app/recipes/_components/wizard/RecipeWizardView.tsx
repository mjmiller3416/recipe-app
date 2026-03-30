"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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
import { Form } from "@/components/ui/form";
import { useRecipeWizard } from "./useRecipeWizard";
import {
  MethodSelectionStep,
  RecipeBasicsStep,
  IngredientsStep,
  DirectionsNotesStep,
  NutritionStep,
  AIGenerateStep,
} from "./steps";

// ============================================================================
// Constants
// ============================================================================

const STEP_TITLES = [
  "Choose Method",
  "Recipe Basics",
  "Ingredients",
  "Directions & Notes",
  "Nutrition Facts",
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
  const handleSave = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const wizard = useRecipeWizard({ onSave: handleSave });
  const { currentStep, resetWizard } = wizard;

  const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  // Suppress transition-all on form inputs during step changes so
  // elements don't animate from their initial state on mount.
  const contentRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      prevStepRef.current = currentStep;
      const el = contentRef.current;
      if (!el) return;
      el.classList.add("no-transition");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.classList.remove("no-transition");
        });
      });
    }
  }, [currentStep]);

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleDiscardClick = useCallback(() => {
    if (!wizard.hasUnsavedData) {
      resetWizard();
      return;
    }
    setShowDiscardConfirm(true);
  }, [wizard.hasUnsavedData, resetWizard]);

  const handleDiscardConfirm = useCallback(() => {
    setShowDiscardConfirm(false);
    resetWizard();
  }, [resetWizard]);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Layout: fixed-height flex column with 3 zones.
        ─────────────────────────────────────
        │  Header  (shrink-0)               │
        ├───────────────────────────────────┤
        │  Scrollable step content (flex-1) │
        ├───────────────────────────────────┤
        │  Footer nav (shrink-0)            │
        ─────────────────────────────────────

        NOTE: If your DialogContent already applies padding/gap via
        shadcn defaults, add these overrides to your dialog.tsx
        variant instead of using !important here:
          - padding: 0
          - gap: 0
          - display: flex / flex-direction: column
      */}
      <DialogContent
        size="xl"
        className="flex flex-col h-[85vh] p-0 gap-0 overflow-hidden"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="shrink-0 px-6 pt-5 pb-4 space-y-3">
          <DialogHeader className="text-center sm:text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Create New Recipe
            </p>
            <DialogTitle className="text-2xl font-bold">
              {wizard.currentStep === 2 && wizard.creationMethod === "ai-generate"
                ? "AI Recipe Generator"
                : STEP_TITLES[wizard.currentStep - 1]}
            </DialogTitle>
            <DialogDescription>
              Step {wizard.currentStep} of {TOTAL_STEPS}
            </DialogDescription>
          </DialogHeader>

          {/* Dev: fill sample data (floating so it doesn't affect layout) */}
          {process.env.NODE_ENV === "development" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={wizard.fillSampleData}
              className="absolute top-2 left-2 z-50 text-xs opacity-50 hover:opacity-100 transition-opacity"
            >
              Dev: Fill Sample Data
            </Button>
          )}

          {/* Progress bar */}
          <Progress value={progressPercent} className="h-1" />
        </div>

        {/* ── Scrollable step content ─────────────────────────────── */}
        <Form {...wizard.form}>
        <div
          ref={contentRef}
          className="flex-1 min-h-0 overflow-y-auto border-t border-border px-6 py-6"
        >
          {wizard.currentStep === 1 && (
            <MethodSelectionStep
              selectedMethod={wizard.creationMethod}
              onSelect={(method) => {
                wizard.setCreationMethod(method);
                wizard.goToStep(2);
              }}
            />
          )}

          {wizard.currentStep === 2 && (
            wizard.creationMethod === "ai-generate" ? (
              <AIGenerateStep
                prompt={wizard.aiPrompt}
                setPrompt={wizard.setAiPrompt}
                preferences={wizard.aiPreferences}
                setPreferences={wizard.setAiPreferences}
                generatedRecipe={wizard.generatedRecipe}
                isGenerating={wizard.isGenerating}
                error={wizard.aiError}
                onGenerate={wizard.handleWizardGenerate}
                onAcceptRecipe={wizard.handleAcceptGeneratedRecipe}
              />
            ) : (
              <RecipeBasicsStep
                imagePreview={wizard.imagePreview}
                isAiGenerated={wizard.isAiGenerated}
                onImageUpload={wizard.handleImageUpload}
                onGeneratedImageAccept={wizard.handleGeneratedImageAccept}
                onBannerOnlyAccept={wizard.handleBannerOnlyAccept}
              />
            )
          )}

          {wizard.currentStep === 3 && (
            <IngredientsStep
              availableIngredients={wizard.availableIngredients}
            />
          )}

          {wizard.currentStep === 4 && (
            <DirectionsNotesStep />
          )}

          {wizard.currentStep === 5 && (
            <NutritionStep
              nutritionFacts={wizard.nutritionFacts}
              onNutritionChange={wizard.setNutritionFacts}
            />
          )}
        </div>
        </Form>

          {/* ── Footer navigation ───────────────────────────────────── */}
          <div className="relative flex w-full items-center justify-center px-6 py-4 border-t border-border-subtle bg-background/50">
            {/* Discard — pinned far left (steps 2+) */}
            {currentStep > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDiscardClick}
                disabled={wizard.isSubmitting}
                className="absolute left-6 text-destructive hover:text-destructive"
              >
                <X className="size-3.5 mr-1.5" strokeWidth={1.5} />
                Discard
              </Button>
            )}

            {/* Center group — navigation buttons */}
            <div className="flex items-center gap-3">
              {/* Step 1: Cancel */}
              {currentStep === 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  className="px-8 font-normal"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              )}

              {/* Steps 3+: Back */}
              {currentStep > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={wizard.prevStep}
                  disabled={wizard.isSubmitting}
                >
                  <ArrowLeft className="size-4 mr-2" strokeWidth={1.5} />
                  Back
                </Button>
              )}

              {/* Steps 2-4: Next Step (hidden for AI generate on step 2) */}
              {currentStep > 1 && currentStep < TOTAL_STEPS && !(currentStep === 2 && wizard.creationMethod === "ai-generate") && (
                <Button
                  type="button"
                  onClick={wizard.nextStep}
                  disabled={!wizard.canProceed}
                >
                  Next Step
                  <ArrowRight className="size-4 ml-2" strokeWidth={1.5} />
                </Button>
              )}

              {/* Step 5: Save Recipe */}
              {currentStep === TOTAL_STEPS && (
                <Button
                  type="button"
                  onClick={wizard.handleSubmit}
                  disabled={wizard.isSubmitting}
                  aria-busy={wizard.isSubmitting}
                  aria-label={wizard.isSubmitting ? "Saving recipe..." : "Save Recipe"}
                >
                  {wizard.isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="size-4 mr-2" strokeWidth={1.5} />}
                  {wizard.isSubmitting ? "Saving..." : "Save Recipe"}
                </Button>
              )}
            </div>
          </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard this recipe?</AlertDialogTitle>
          <AlertDialogDescription>
            All progress will be lost. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Editing</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDiscardConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}