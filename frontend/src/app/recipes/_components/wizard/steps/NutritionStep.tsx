"use client";

import { useCallback } from "react";
import { Beaker, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageUploadCard } from "@/app/recipes/_components/add-edit/ImageUploadCard";
import { useEstimateNutrition } from "@/hooks/api/useAI";
import type { NutritionFactsDTO } from "@/types/ai";
import type { WizardIngredient } from "@/types/recipe";

interface NutritionStepProps {
  recipeName: string;
  imagePreview: string | null;
  isAiGenerated: boolean;
  setIsAiGenerated: (v: boolean) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGeneratedImageAccept: (
    refBase64: string,
    refDataUrl: string,
    bannerBase64?: string
  ) => void;
  onBannerOnlyAccept: (bannerBase64: string) => void;
  // Nutrition props
  nutritionFacts: NutritionFactsDTO | null;
  onNutritionChange: (facts: NutritionFactsDTO | null) => void;
  ingredients: WizardIngredient[];
  servings: string;
}

const NUTRITION_ROWS: {
  key: keyof NutritionFactsDTO;
  label: string;
  unit: string;
  indent?: boolean;
}[] = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "total_fat_g", label: "Total Fat", unit: "g" },
  { key: "saturated_fat_g", label: "Saturated Fat", unit: "g", indent: true },
  { key: "trans_fat_g", label: "Trans Fat", unit: "g", indent: true },
  { key: "cholesterol_mg", label: "Cholesterol", unit: "mg" },
  { key: "sodium_mg", label: "Sodium", unit: "mg" },
  { key: "total_carbs_g", label: "Total Carbohydrates", unit: "g" },
  { key: "dietary_fiber_g", label: "Dietary Fiber", unit: "g", indent: true },
  { key: "total_sugars_g", label: "Total Sugars", unit: "g", indent: true },
  { key: "protein_g", label: "Protein", unit: "g" },
];

export function NutritionStep({
  recipeName,
  imagePreview,
  isAiGenerated,
  setIsAiGenerated,
  onImageUpload,
  onGeneratedImageAccept,
  onBannerOnlyAccept,
  nutritionFacts,
  onNutritionChange,
  ingredients,
  servings,
}: NutritionStepProps) {
  const estimateMutation = useEstimateNutrition();

  const canEstimate =
    recipeName.trim().length > 0 &&
    ingredients.some((ing) => ing.ingredientName.trim().length > 0);

  const handleEstimate = useCallback(() => {
    const validIngredients = ingredients
      .filter((ing) => ing.ingredientName.trim().length > 0)
      .map((ing) => ({
        name: ing.ingredientName.trim(),
        quantity: ing.quantity.trim() ? parseFloat(ing.quantity) : null,
        unit: ing.unit || null,
      }));

    const servingsNum = servings.trim() ? parseInt(servings, 10) : null;

    estimateMutation.mutate(
      {
        recipe_name: recipeName.trim(),
        ingredients: validIngredients,
        servings: Number.isNaN(servingsNum) ? null : servingsNum,
      },
      {
        onSuccess: (data) => {
          if (data.success && data.nutrition_facts) {
            onNutritionChange(data.nutrition_facts);
          }
        },
      }
    );
  }, [recipeName, ingredients, servings, estimateMutation, onNutritionChange]);

  const handleClear = useCallback(() => {
    onNutritionChange(null);
  }, [onNutritionChange]);

  const formatValue = (value: number | null | boolean): string => {
    if (value === null || typeof value === "boolean") return "—";
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Image Upload / Generation Section */}
      <section>
        <ImageUploadCard
          recipeName={recipeName}
          imagePreview={imagePreview}
          isAiGenerated={isAiGenerated}
          onAiGeneratedChange={setIsAiGenerated}
          onImageUpload={onImageUpload}
          onGeneratedImageAccept={onGeneratedImageAccept}
          onBannerOnlyAccept={onBannerOnlyAccept}
        />
      </section>

      <Separator />

      {/* Nutrition Facts Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beaker
              className="size-5 text-muted-foreground"
              strokeWidth={1.5}
            />
            <h3 className="text-base font-semibold text-foreground">
              Nutrition Facts
            </h3>
            <span className="text-sm text-muted-foreground">(per serving)</span>
          </div>
          <div className="flex items-center gap-2">
            {nutritionFacts && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                aria-label="Clear nutrition facts"
              >
                <Trash2 className="size-4 mr-1.5" strokeWidth={1.5} />
                Clear
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEstimate}
              disabled={!canEstimate || estimateMutation.isPending}
            >
              {estimateMutation.isPending ? (
                <>
                  <Loader2
                    className="size-4 mr-1.5 animate-spin"
                    strokeWidth={1.5}
                  />
                  <span className="sr-only">Estimating nutrition facts</span>
                  Estimating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4 mr-1.5" strokeWidth={1.5} />
                  Estimate with AI
                </>
              )}
            </Button>
          </div>
        </div>

        {!canEstimate && !nutritionFacts && (
          <p className="text-sm text-muted-foreground">
            Add a recipe name and ingredients first to estimate nutrition.
          </p>
        )}

        {estimateMutation.isError && (
          <div role="alert" aria-live="assertive">
            <p className="text-sm text-destructive">
              Failed to estimate nutrition. Please try again.
            </p>
          </div>
        )}

        {nutritionFacts ? (
          <div className="rounded-lg border border-border bg-card p-4 space-y-1">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-semibold text-foreground">
                Nutrition Facts
              </span>
              {nutritionFacts.is_ai_estimated && (
                <Badge variant="secondary">AI Estimated</Badge>
              )}
            </div>
            <Separator />
            {NUTRITION_ROWS.map((row) => (
              <div
                key={row.key}
                className={`flex items-center justify-between py-1 text-sm ${
                  row.indent ? "pl-4" : ""
                } ${!row.indent ? "font-medium" : "text-muted-foreground"}`}
              >
                <span>{row.label}</span>
                <span>
                  {formatValue(nutritionFacts[row.key])}
                  {nutritionFacts[row.key] !== null &&
                    typeof nutritionFacts[row.key] !== "boolean" &&
                    ` ${row.unit}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          canEstimate &&
          !estimateMutation.isPending && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Click &quot;Estimate with AI&quot; to generate per-serving
                nutrition facts based on your ingredients.
              </p>
            </div>
          )
        )}
      </section>
    </div>
  );
}
