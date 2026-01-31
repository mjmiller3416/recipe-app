"use client";

import { useState, useEffect } from "react";
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
import { useSettings } from "@/hooks/useSettings";
import { useGenerateImage, useGenerateBanner } from "@/hooks/api/useAI";

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
  /** Recipe name used for generating the image prompt */
  recipeName: string;
  /** Whether the current image was AI-generated */
  isAiGenerated?: boolean;
  /** Handler to update the AI-generated flag */
  onAiGeneratedChange?: (isAiGenerated: boolean) => void;
}

export function ImageUploadCard({
  imagePreview,
  onImageUpload,
  onGeneratedImageAccept,
  recipeName,
  isAiGenerated = false,
  onAiGeneratedChange,
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

  // Selection state for which images to regenerate
  const [regenerateReference, setRegenerateReference] = useState(true);
  const [regenerateBanner, setRegenerateBanner] = useState(true);

  // Update state when imagePreview changes externally
  useEffect(() => {
    if (imagePreview && imageState === "empty") {
      setImageState(isAiGenerated ? "generated" : "uploaded");
    } else if (!imagePreview && imageState !== "generating" && imageState !== "error") {
      setImageState("empty");
    }
  }, [imagePreview, isAiGenerated]);

  // Animate progress bar during generation
  useEffect(() => {
    if (generationStep === "idle") {
      setProgress(0);
      return;
    }

    // Determine progress ranges based on what's being generated
    const generatingBothImages = regenerateReference && regenerateBanner;
    const generatingOnlyReference = regenerateReference && !regenerateBanner;
    const generatingOnlyBanner = !regenerateReference && regenerateBanner;

    let startProgress = 0;
    let targetProgress = 100;

    if (generatingBothImages) {
      // Target: 0-50% for reference, 50-100% for banner
      startProgress = generationStep === "reference" ? 0 : 50;
      targetProgress = generationStep === "reference" ? 50 : 100;
    } else if (generatingOnlyReference) {
      // Single step: 0-100%
      startProgress = 0;
      targetProgress = 100;
    } else if (generatingOnlyBanner) {
      // Single step: 0-100%
      startProgress = 0;
      targetProgress = 100;
    }

    const duration = 15000; // 15 seconds
    const intervalMs = 100; // Update every 100ms
    const increment = ((targetProgress - startProgress) / duration) * intervalMs;

    // Set starting point immediately
    setProgress(startProgress);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        // Stop slightly before target to leave room for completion snap
        if (next >= targetProgress - 2) {
          return targetProgress - 2;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [generationStep, regenerateReference, regenerateBanner]);

  const handleGenerate = async () => {
    if (!recipeName.trim()) {
      setGeneratingError("Please enter a recipe name first");
      setImageState("error");
      return;
    }

    // Validate that at least one image type is selected
    if (!regenerateReference && !regenerateBanner) {
      setGeneratingError("Please select at least one image type to regenerate");
      setImageState("error");
      return;
    }

    setImageState("generating");
    setGeneratingError(null);
    setPendingGeneratedImage(null);

    try {
      let refImageData: string | undefined;
      let bannerImageData: string | undefined;

      // Step 1: Generate reference image if selected
      if (regenerateReference) {
        setGenerationStep("reference");
        const refResult = await generateImageMutation.mutateAsync({
          recipeName,
          customPrompt: settings.aiFeatures.imageGenerationPrompt,
        });

        if (!refResult.success || !refResult.reference_image_data) {
          throw new Error(refResult.error || "Failed to generate reference image");
        }

        refImageData = refResult.reference_image_data;

        // If only generating reference, snap to 100%
        if (!regenerateBanner) {
          setProgress(100);
        } else {
          // If generating both, snap to 50% after reference completes
          setProgress(50);
        }
      }

      // Step 2: Generate banner image if selected
      if (regenerateBanner) {
        setGenerationStep("banner");

        // If we just generated a reference image, use it for the banner
        // Otherwise, use existing image data if available
        const referenceDataForBanner = refImageData || generatedImageData;

        if (!referenceDataForBanner) {
          throw new Error("No reference image available for banner generation. Please regenerate the reference image first.");
        }

        const bannerResult = await generateBannerMutation.mutateAsync({
          recipeName,
          referenceImageData: referenceDataForBanner,
        });

        if (bannerResult.success) {
          bannerImageData = bannerResult.banner_image_data;
        }

        setProgress(100); // Snap to 100% when banner completes
      }

      // Complete - display generated images
      // Only update reference image if it was regenerated
      if (refImageData) {
        const dataUrl = `data:image/png;base64,${refImageData}`;
        onGeneratedImageAccept(refImageData, dataUrl, bannerImageData);
      } else {
        // Only banner was regenerated - keep existing reference, just update banner
        onGeneratedImageAccept(
          generatedImageData || "",
          imagePreview || "",
          bannerImageData
        );
      }

      onAiGeneratedChange?.(true);
      setImageState("generated");
    } catch (error) {
      setGeneratingError(
        error instanceof Error ? error.message : "Image generation failed"
      );
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

  const handleResetToEmpty = () => {
    setImageState("empty");
    setPendingGeneratedImage(null);
    setGeneratingError(null);
  };

  // Get the image to display
  const displayImage = pendingGeneratedImage?.dataUrl || imagePreview;

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-primary-surface rounded-lg">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              Recipe Image
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload or generate an appetizing photo
            </p>
          </div>
        </div>

        {/* Image Preview Area */}
        <div className="aspect-square rounded-lg overflow-hidden bg-primary-surface border-2 border-dashed border-border mb-4 relative">
          {/* Empty State */}
          {imageState === "empty" && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="p-4 bg-primary-surface rounded-full mb-4">
                <ImageIcon className="h-12 w-12 text-primary" />
              </div>
              <p className="text-sm font-medium">No image uploaded</p>
              <p className="text-xs mt-1">Use the buttons below</p>
            </div>
          )}

          {/* Generating State */}
          {imageState === "generating" && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6">
              <div className="p-4 bg-primary-surface rounded-full mb-4">
                <Sparkles className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <p className="text-sm font-medium text-primary">
                {(() => {
                  const generatingBothImages = regenerateReference && regenerateBanner;
                  if (generatingBothImages) {
                    return generationStep === "reference"
                      ? "Generating reference image (1 of 2)..."
                      : "Generating banner image (2 of 2)...";
                  } else if (regenerateReference) {
                    return "Generating reference image...";
                  } else {
                    return "Generating banner image...";
                  }
                })()}
              </p>
              {/* Progress Bar */}
              <div className="w-full max-w-[200px] mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs mt-2 text-center text-muted-foreground">
                  {Math.round(progress)}%
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {imageState === "error" && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
              <div className="p-4 bg-destructive/10 rounded-full mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <p className="text-sm font-medium text-destructive text-center">
                {generatingError || "Something went wrong"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                className="mt-4"
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
                <img
                  src={displayImage}
                  alt="Recipe preview"
                  className="w-full h-full object-cover"
                />
                {/* AI Generated Badge */}
                {(imageState === "generated" || isAiGenerated) && (
                  <Badge
                    className="absolute top-3 left-3 bg-primary hover:bg-primary-hover text-primary-foreground gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    AI Generated
                  </Badge>
                )}
              </>
            )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Empty State Buttons */}
          {imageState === "empty" && (
            <>
              {/* Image selection checkboxes */}
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Select images to generate:
                </p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="generate-reference"
                    checked={regenerateReference}
                    onCheckedChange={(checked) =>
                      setRegenerateReference(checked === true)
                    }
                  />
                  <Label
                    htmlFor="generate-reference"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Reference image (1:1 square)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="generate-banner"
                    checked={regenerateBanner}
                    onCheckedChange={(checked) =>
                      setRegenerateBanner(checked === true)
                    }
                  />
                  <Label
                    htmlFor="generate-banner"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Banner image (21:9 ultrawide)
                  </Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleUploadClick}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-2"
                  onClick={handleGenerate}
                >
                  <Sparkles className="h-4 w-4" />
                  Generate
                </Button>
              </div>
            </>
          )}

          {/* Generating State - No buttons, just the loading state */}
          {imageState === "generating" && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <Button
                type="button"
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
                  aria-label="Generate a new image"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
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
            <>
              {/* Image selection checkboxes for regeneration */}
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Select images to regenerate:
                </p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="regenerate-reference"
                    checked={regenerateReference}
                    onCheckedChange={(checked) =>
                      setRegenerateReference(checked === true)
                    }
                  />
                  <Label
                    htmlFor="regenerate-reference"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Reference image (1:1 square)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="regenerate-banner"
                    checked={regenerateBanner}
                    onCheckedChange={(checked) =>
                      setRegenerateBanner(checked === true)
                    }
                  />
                  <Label
                    htmlFor="regenerate-banner"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Banner image (21:9 ultrawide)
                  </Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleUploadClick}
                >
                  <Upload className="h-4 w-4" />
                  Change Image
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-2"
                  onClick={handleGenerate}
                >
                  <Sparkles className="h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </>
          )}

          {/* Error State - handled in the preview area */}
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          id="recipe-image"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Helper text */}
        <p className="text-xs text-muted-foreground text-center mt-3">
          AI generation uses recipe details to create an image
        </p>
      </CardContent>
    </Card>
  );
}
