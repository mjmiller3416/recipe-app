"use client";

import { Beaker } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageUploadCard } from "@/app/recipes/_components/add-edit/ImageUploadCard";

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
  generatedRefData: string | null;
  generatedBannerData: string | null;
}

export function NutritionStep({
  recipeName,
  imagePreview,
  isAiGenerated,
  setIsAiGenerated,
  onImageUpload,
  onGeneratedImageAccept,
  onBannerOnlyAccept,
}: NutritionStepProps) {
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

      {/* Nutrition Placeholder */}
      <section className="bg-muted/50 rounded-lg p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-muted p-3">
            <Beaker
              className="size-8 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Nutrition Facts
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Detailed nutrition tracking is coming soon. You will be able to
              add calories, macros, and more.
            </p>
          </div>
          <Badge variant="outline">Coming in Phase 2</Badge>
        </div>
      </section>
    </div>
  );
}
