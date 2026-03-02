"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Upload,
  ImageIcon,
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/utils";
import { useSettings } from "@/hooks/persistence/useSettings";
import { useGenerateImage, useGenerateBanner } from "@/hooks/api/useAI";
import type { ImageGenerationType } from "@/types/ai";

type ImageState = "empty" | "uploading" | "uploaded" | "generating" | "generated" | "error";

interface ImageUploadCardProps {
  /** Current image preview URL (data URL or Cloudinary URL) */
  imagePreview: string | null;
  /** Handler for file upload input changes */
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handler when user accepts a generated image (reference + optional banner) */
  onGeneratedImageAccept: (
    referenceBase64: string,
    referenceDataUrl: string,
    bannerBase64?: string
  ) => void;
  /** Handler when user accepts a banner-only generated image */
  onBannerOnlyAccept?: (bannerBase64: string) => void;
  /** Recipe name used for generating the image prompt */
  recipeName: string;
  /** Whether the current image was AI-generated */
  isAiGenerated?: boolean;
  /** Handler to update the AI-generated flag */
  onAiGeneratedChange?: (isAiGenerated: boolean) => void;
  /** Whether in edit mode (enables selective generation UI) */
  isEditMode?: boolean;
  /** Compact layout — no Card wrapper, 1:1 drop zone (for wizard) */
  compact?: boolean;
}

export const ImageUploadCard = memo(function ImageUploadCard({
  imagePreview,
  onImageUpload,
  onGeneratedImageAccept,
  onBannerOnlyAccept,
  recipeName,
  isAiGenerated = false,
  onAiGeneratedChange,
  isEditMode = false,
  compact = false,
}: ImageUploadCardProps) {
  const { settings } = useSettings();
  const generateImageMutation = useGenerateImage();
  const generateBannerMutation = useGenerateBanner();

  // Determine initial state based on props
  const getInitialState = (): ImageState => {
    if (imagePreview) {
      return isAiGenerated ? "generated" : "uploaded";
    }
    return "empty";
  };

  const [imageState, setImageState] = useState<ImageState>(getInitialState);
  const [generationStep, setGenerationStep] = useState<"idle" | "reference" | "banner">("idle");
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [pendingGeneratedImage, setPendingGeneratedImage] = useState<{
    base64: string;
    dataUrl: string;
  } | null>(null);
  const [progress, setProgress] = useState(0);

  // Selective generation checkboxes (edit mode only)
  const [generateReference, setGenerateReference] = useState(true);
  const [generateBanner, setGenerateBanner] = useState(true);

  // Derive image type from checkbox state
  const getImageType = useCallback((): ImageGenerationType => {
    if (generateReference && generateBanner) return "both";
    if (generateReference) return "reference";
    return "banner";
  }, [generateReference, generateBanner]);

  const isGenerating = imageState === "generating";
  const noneSelected = isEditMode && !generateReference && !generateBanner;

  // Update state when imagePreview changes externally
  useEffect(() => {
    if (imagePreview && imageState === "empty") {
      setImageState(isAiGenerated ? "generated" : "uploaded");
    } else if (!imagePreview && imageState !== "generating" && imageState !== "error") {
      setImageState("empty");
    }
  }, [imagePreview, isAiGenerated, imageState]);

  // Animate progress bar during generation
  useEffect(() => {
    if (generationStep === "idle") {
      setProgress(0);
      return;
    }

    const imageType = isEditMode ? getImageType() : "both";
    const isSingleStep = imageType !== "both";

    const startProgress = isSingleStep ? 0 : (generationStep === "reference" ? 0 : 50);
    const targetProgress = isSingleStep ? 100 : (generationStep === "reference" ? 50 : 100);
    const duration = 15000;
    const intervalMs = 100;
    const increment = ((targetProgress - startProgress) / duration) * intervalMs;

    setProgress(startProgress);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= targetProgress - 2) {
          return targetProgress - 2;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [generationStep, getImageType, isEditMode]);

  const handleGenerate = async () => {
    if (!recipeName.trim()) {
      setGeneratingError("Please enter a recipe name first");
      setImageState("error");
      return;
    }

    const imageType = isEditMode ? getImageType() : "both";

    setImageState("generating");
    setGeneratingError(null);
    setPendingGeneratedImage(null);

    try {
      if (imageType === "both") {
        setGenerationStep("reference");
        const refResult = await generateImageMutation.mutateAsync({
          recipeName,
          customPrompt: settings.aiFeatures.imageGenerationPrompt,
          imageType: "reference",
        });

        if (!refResult.success || !refResult.reference_image_data) {
          throw new Error(refResult.error || "Failed to generate reference image");
        }

        setProgress(50);
        setGenerationStep("banner");
        const bannerResult = await generateBannerMutation.mutateAsync({
          recipeName,
          referenceImageData: refResult.reference_image_data,
        });

        setProgress(100);
        const dataUrl = `data:image/png;base64,${refResult.reference_image_data}`;
        onGeneratedImageAccept(
          refResult.reference_image_data,
          dataUrl,
          bannerResult.success ? bannerResult.banner_image_data : undefined
        );
        onAiGeneratedChange?.(true);
        setImageState("generated");

      } else if (imageType === "reference") {
        setGenerationStep("reference");
        const refResult = await generateImageMutation.mutateAsync({
          recipeName,
          customPrompt: settings.aiFeatures.imageGenerationPrompt,
          imageType: "reference",
        });

        if (!refResult.success || !refResult.reference_image_data) {
          throw new Error(refResult.error || "Failed to generate reference image");
        }

        setProgress(100);
        const dataUrl = `data:image/png;base64,${refResult.reference_image_data}`;
        onGeneratedImageAccept(refResult.reference_image_data, dataUrl);
        onAiGeneratedChange?.(true);
        setImageState("generated");

      } else {
        setGenerationStep("banner");
        const bannerResult = await generateImageMutation.mutateAsync({
          recipeName,
          imageType: "banner",
        });

        if (!bannerResult.success || !bannerResult.banner_image_data) {
          throw new Error(bannerResult.error || "Failed to generate banner image");
        }

        setProgress(100);
        onBannerOnlyAccept?.(bannerResult.banner_image_data);
        onAiGeneratedChange?.(true);
        setImageState("generated");
      }
    } catch (error) {
      setGeneratingError(getErrorMessage(error, "Image generation failed"));
      setImageState("error");
    } finally {
      setGenerationStep("idle");
    }
  };

  const handleAcceptGenerated = () => {
    if (pendingGeneratedImage) {
      onGeneratedImageAccept(
        pendingGeneratedImage.base64,
        pendingGeneratedImage.dataUrl
      );
      onAiGeneratedChange?.(true);
      setPendingGeneratedImage(null);
    }
  };

  const handleUploadClick = () => {
    document.getElementById("recipe-image")?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImageUpload(e);
    setImageState("uploaded");
    onAiGeneratedChange?.(false);
    setPendingGeneratedImage(null);
    setGeneratingError(null);
  };

  // Get the image to display
  const displayImage = pendingGeneratedImage?.dataUrl || imagePreview;

  // ── Shared inner content (used by both compact and card modes) ──────────
  const innerContent = (
    <>
      {/* Header */}
      <div className={cn("flex items-center gap-2.5", compact ? "mb-3" : "mb-6")}>
        <div className={cn(
          "flex items-center justify-center rounded-lg bg-primary-surface",
          compact ? "size-7" : "size-9"
        )}>
          <ImageIcon className={cn(compact ? "size-3.5" : "size-5", "text-primary")} />
        </div>
        <div>
          <h2 className={cn(compact ? "text-sm" : "text-lg", "font-semibold text-foreground leading-tight")}>
            Recipe Image
          </h2>
          <p className={cn("text-muted-foreground leading-tight", compact ? "text-xs" : "text-sm")}>
            Upload or generate
          </p>
        </div>
      </div>

      {/* Image Preview Area — always 1:1 */}
      <div className={cn(
        "w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed relative",
        "transition-colors",
        imageState === "empty"
          ? "border-muted-foreground/40 bg-muted/50"
          : "border-transparent bg-muted/30"
      )}>
        {/* Empty State */}
        {imageState === "empty" && (
          <button
            type="button"
            onClick={handleUploadClick}
            className="flex flex-col items-center justify-center size-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No image uploaded</p>
            <p className="text-xs mt-0.5 text-muted-foreground">Click or drag to upload</p>
          </button>
        )}

        {/* Generating State */}
        {imageState === "generating" && (
          <div className="flex flex-col items-center justify-center size-full text-muted-foreground px-6">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="size-6 text-primary animate-pulse" />
            </div>
            <p className="text-sm font-medium text-primary">
              {isEditMode && getImageType() === "reference"
                ? "Generating recipe image..."
                : isEditMode && getImageType() === "banner"
                  ? "Generating banner image..."
                  : generationStep === "reference"
                    ? "Generating recipe image..."
                    : "Generating banner image..."}
            </p>
            {/* Progress Bar */}
            <div className="w-full max-w-40 mt-4">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs mt-1.5 text-center text-muted-foreground">
                {Math.round(progress)}%
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {imageState === "error" && (
          <div className="flex flex-col items-center justify-center size-full text-muted-foreground p-4">
            <div className="size-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
              <AlertCircle className="size-6 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive text-center">
              {generatingError || "Something went wrong"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Image Display (Generated or Uploaded) */}
        {(imageState === "generated" || imageState === "uploaded") &&
          displayImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- src may be a base64 data URL from AI generation */}
              <img
                src={displayImage}
                alt="Recipe preview"
                className="size-full object-cover"
              />
              {/* AI Generated Badge */}
              {(imageState === "generated" || isAiGenerated) && (
                <Badge
                  className="absolute top-2.5 left-2.5 bg-primary hover:bg-primary-hover text-primary-foreground gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  AI Generated
                </Badge>
              )}
            </>
          )}
      </div>

      {/* Image Type Selector - Edit Mode Only */}
      {isEditMode && (
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="generate-reference"
              size="sm"
              checked={generateReference}
              disabled={isGenerating}
              onCheckedChange={(checked) => setGenerateReference(!!checked)}
            />
            <Label
              htmlFor="generate-reference"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Recipe image
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="generate-banner"
              size="sm"
              checked={generateBanner}
              disabled={isGenerating}
              onCheckedChange={(checked) => setGenerateBanner(!!checked)}
            />
            <Label
              htmlFor="generate-banner"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Banner image
            </Label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3 space-y-2">
        {/* Empty State Buttons */}
        {imageState === "empty" && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size={compact ? "sm" : "default"}
              className="flex-1 gap-2"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <Button
              type="button"
              size={compact ? "sm" : "default"}
              className="flex-1 gap-2"
              onClick={handleGenerate}
              disabled={noneSelected}
            >
              <Sparkles className="h-4 w-4" />
              Generate
            </Button>
          </div>
        )}

        {/* Generating State */}
        {imageState === "generating" && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size={compact ? "sm" : "default"}
              className="flex-1 gap-2"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <Button
              type="button"
              size={compact ? "sm" : "default"}
              className="flex-1 gap-2"
              disabled
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              Generate
            </Button>
          </div>
        )}

        {/* Generated State (pending acceptance) */}
        {imageState === "generated" && pendingGeneratedImage && (
          <>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="default"
                size={compact ? "sm" : "default"}
                className="flex-1 gap-2"
                onClick={handleAcceptGenerated}
              >
                <Check className="h-4 w-4" />
                Use This Image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerate}
                disabled={noneSelected}
                aria-label="Generate a new image"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size={compact ? "sm" : "default"}
              className="w-full gap-2"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4" />
              Upload Different Image
            </Button>
          </>
        )}

        {/* Uploaded State or Accepted Generated State */}
        {((imageState === "uploaded") ||
          (imageState === "generated" && !pendingGeneratedImage && imagePreview)) && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size={compact ? "sm" : "default"}
                className="flex-1 gap-2"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4" />
                Replace
              </Button>
              <Button
                type="button"
                size={compact ? "sm" : "default"}
                className="flex-1 gap-2"
                onClick={handleGenerate}
                disabled={noneSelected}
              >
                <Sparkles className="h-4 w-4" />
                Regenerate
              </Button>
            </div>
          )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        id="recipe-image"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Helper text (non-compact mode only) */}
      {!compact && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          AI generation uses recipe details to create an image
        </p>
      )}
    </>
  );

  // ── Render: compact mode = bare div, full mode = Card wrapper ──────────

  if (compact) {
    return <div>{innerContent}</div>;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {innerContent}
      </CardContent>
    </Card>
  );
});