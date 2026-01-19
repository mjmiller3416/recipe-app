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
import { imageGenerationApi } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";

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

  // Update state when imagePreview changes externally
  useEffect(() => {
    if (imagePreview && imageState === "empty") {
      setImageState(isAiGenerated ? "generated" : "uploaded");
    } else if (!imagePreview && imageState !== "generating" && imageState !== "error") {
      setImageState("empty");
    }
  }, [imagePreview, isAiGenerated]);

  const handleGenerate = async () => {
    if (!recipeName.trim()) {
      setGeneratingError("Please enter a recipe name first");
      setImageState("error");
      return;
    }

    setImageState("generating");
    setGenerationStep("reference");
    setGeneratingError(null);
    setPendingGeneratedImage(null);

    try {
      // Step 1: Generate reference image
      const refResult = await imageGenerationApi.generate(
        recipeName,
        settings.aiFeatures.imageGenerationPrompt
      );

      if (!refResult.success || !refResult.reference_image_data) {
        throw new Error(refResult.error || "Failed to generate reference image");
      }

      // Step 2: Generate banner image from reference
      setGenerationStep("banner");
      const bannerResult = await imageGenerationApi.generateBanner(
        recipeName,
        refResult.reference_image_data
      );

      // Complete - display both images
      const dataUrl = `data:image/png;base64,${refResult.reference_image_data}`;
      onGeneratedImageAccept(
        refResult.reference_image_data,
        dataUrl,
        bannerResult.success ? bannerResult.banner_image_data : undefined
      );
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
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="p-4 bg-primary-surface rounded-full mb-4">
                <Sparkles className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <p className="text-sm font-medium text-primary">
                {generationStep === "reference"
                  ? "Generating reference image (1 of 2)..."
                  : "Generating banner image (2 of 2)..."}
              </p>
              <p className="text-xs mt-1 text-muted-foreground">This may take a moment</p>
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
