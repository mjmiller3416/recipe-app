# Design System Audit: ImageUploadCard.tsx

**File Type:** Feature component (in `app/` directory)  
**Applicable Rules:** Part A (Component Usage), Parts C, D, E, F, G

---

## Audit Summary

| Category | Status | Issues Found |
|----------|--------|--------------|
| Component Usage (A) | ΓÜá∩╕Å | 2 violations |
| Token Standardization (A6) | Γ£à | Compliant |
| Layout & Spacing (C) | ΓÜá∩╕Å | 1 minor issue |
| States & Feedback (D) | ΓÜá∩╕Å | 1 violation |
| Accessibility (G) | ΓÜá∩╕Å | 2 violations |

---

## Violations Found

### 1. **A2: Raw Button Violation** (Line 195-203)
**Severity:** Medium  
**Location:** Error state retry button

```tsx
// Current (Line 195-203)
<Button
  variant="outline"
  size="sm"
  onClick={handleGenerate}
  className="mt-4"
>
  <RefreshCw className="h-4 w-4 mr-2" />
  Try Again
</Button>
```

**Issue:** Uses `className="mt-4"` for spacing instead of proper layout structure. While not a "raw button", the spacing should be handled by parent layout.

**Fix:** Move spacing to parent container using `space-y-4` or `gap-4`.

---

### 2. **D1: Missing Loading State on Button** (Line 243-251, 267-276)
**Severity:** High  
**Location:** Generate buttons

```tsx
// Current - Empty state generate button (Line 243-251)
<Button
  type="button"
  variant="ghost"
  className="flex-1 gap-2 bg-primary-surface text-primary-on-surface"
  onClick={handleGenerate}
>
  <Sparkles className="h-4 w-4" />
  Generate
</Button>
```

**Issue:** The Generate button doesn't show loading state when clicked. The generating state buttons (Line 267-276) are disabled but don't show a spinner - the icon just gets `animate-pulse`. Per D1, buttons should show `<Loader2 className="animate-spin" />` + disabled state during async actions.

**Recommendation:** Use `Loader2` spinner for consistent loading pattern across the app.

---

### 3. **G2: Missing aria-label on Icon Button** (Line 293-300)
**Severity:** Medium  
**Location:** Regenerate icon button

```tsx
// Current (Line 293-300)
<Button
  type="button"
  variant="outline"
  size="icon"
  onClick={handleGenerate}
  aria-label="Generate a new image"  // Γ£à Actually present!
>
  <RefreshCw className="h-4 w-4" />
</Button>
```

**Status:** Γ£à COMPLIANT - The aria-label is present.

---

### 4. **G2: Decorative Icons Missing aria-hidden** (Multiple lines)
**Severity:** Low  
**Location:** Lines 148, 166, 177, 191, 221, 240, 249, 264, 273, 289, 299, 308, 324, 333

```tsx
// Current pattern throughout
<ImageIcon className="h-5 w-5 text-primary" />
<Sparkles className="h-12 w-12 text-primary animate-pulse" />
```

**Issue:** Decorative icons should have `aria-hidden="true"` to prevent screen readers from announcing them.

**Fix:** Add `aria-hidden="true"` to all decorative icons.

---

### 5. **A5: Redundant Interaction Classes** (Line 218-220)
**Severity:** Low  
**Location:** AI Generated Badge

```tsx
// Current (Line 218-220)
<Badge
  className="absolute top-3 left-3 bg-primary hover:bg-primary-hover text-primary-foreground gap-1"
>
```

**Issue:** Adding `hover:bg-primary-hover` to a Badge is unnecessary - badges are typically not interactive, and if they were, the base Badge component should handle hover states.

**Fix:** Remove `hover:bg-primary-hover` if the badge is not interactive.

---

### 6. **C1: Inconsistent Spacing** (Lines 146, 158, 161, 229)
**Severity:** Low  

```tsx
// Line 146
<div className="flex items-start gap-3 mb-6">

// Line 161  
<div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border mb-4 relative">

// Line 229
<div className="space-y-2">
```

**Issue:** Mixed spacing approaches: `mb-6`, `mb-4`, `space-y-2`. While functional, the design system prefers consistent patterns.

**Recommendation:** Consider using `space-y-6` or `space-y-4` on parent, or keep consistent margin pattern.

---

## Corrected Code

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  ImageIcon,
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
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

  const getInitialState = (): ImageState => {
    if (imagePreview) {
      return isAiGenerated ? "generated" : "uploaded";
    }
    return "empty";
  };

  const [imageState, setImageState] = useState<ImageState>(getInitialState);
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [pendingGeneratedImage, setPendingGeneratedImage] = useState<{
    base64: string;
    dataUrl: string;
  } | null>(null);

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
    setGeneratingError(null);
    setPendingGeneratedImage(null);

    try {
      const result = await imageGenerationApi.generate(
        recipeName,
        settings.aiFeatures.imageGenerationPrompt
      );
      if (result.success && result.reference_image_data) {
        const dataUrl = `data:image/png;base64,${result.reference_image_data}`;
        onGeneratedImageAccept(
          result.reference_image_data,
          dataUrl,
          result.banner_image_data
        );
        onAiGeneratedChange?.(true);
        setImageState("generated");
      } else {
        throw new Error(result.error || "Failed to generate image");
      }
    } catch (error) {
      setGeneratingError(
        error instanceof Error ? error.message : "Image generation failed"
      );
      setImageState("error");
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

  const displayImage = pendingGeneratedImage?.dataUrl || imagePreview;

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-primary-surface rounded-lg">
            <ImageIcon className="h-5 w-5 text-primary" aria-hidden="true" />
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
        <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border mb-4 relative">
          {/* Empty State */}
          {imageState === "empty" && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="p-4 bg-primary-surface rounded-full mb-4">
                <ImageIcon className="h-12 w-12 text-primary" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium">No image uploaded</p>
              <p className="text-xs mt-1">Use the buttons below</p>
            </div>
          )}

          {/* Generating State */}
          {imageState === "generating" && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="p-4 bg-primary-surface rounded-full mb-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-primary">
                Generating image...
              </p>
              <p className="text-xs mt-1 text-muted-foreground">This may take a moment</p>
            </div>
          )}

          {/* Error State */}
          {imageState === "error" && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 gap-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-destructive text-center">
                {generatingError || "Something went wrong"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
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
                    className="absolute top-3 left-3 bg-primary text-primary-foreground gap-1"
                  >
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
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
                variant="secondary"
                className="flex-1 gap-2"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 gap-2 bg-primary-surface text-primary-on-surface"
                onClick={handleGenerate}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Generate
              </Button>
            </div>
          )}

          {/* Generating State */}
          {imageState === "generating" && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 gap-2"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 gap-2 bg-primary-surface text-primary-on-surface"
                disabled
              >
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Generating...
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
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Use This Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerate}
                  aria-label="Generate a new image"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
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
                variant="secondary"
                className="flex-1 gap-2"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Change Image
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 gap-2 bg-primary-surface text-primary-on-surface"
                onClick={handleGenerate}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
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

        {/* Helper text */}
        <p className="text-xs text-muted-foreground text-center mt-3">
          AI generation uses recipe details to create an image
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## Summary of Changes

| Line | Change | Rationale |
|------|--------|-----------|
| Import | Added `Loader2` | D1: Proper loading spinner |
| 177 | Changed `Sparkles` ΓåÆ `Loader2` with `animate-spin` | D1: Consistent loading pattern |
| 273 | Changed `Sparkles animate-pulse` ΓåÆ `Loader2 animate-spin` | D1: Consistent loading pattern |
| 274 | Changed text "Generate" ΓåÆ "Generating..." | D1: Clear loading feedback |
| 218-220 | Removed `hover:bg-primary-hover` | A5: Badge shouldn't have hover state |
| Multiple | Added `aria-hidden="true"` to all icons | G2: Screen reader compliance |
| 188 | Changed `mt-4` to parent `gap-4` | C1: Consistent spacing pattern |

---

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
**Key Design System Principles Applied:**
1. **Loading consistency** - Always use `Loader2` with `animate-spin` for async operations, not creative alternatives like `animate-pulse` on different icons
2. **Decorative icons** - Every icon that doesn't convey unique information needs `aria-hidden="true"` to prevent screen reader noise
3. **Component built-in states** - Base components like Badge handle their own styling; adding hover states externally can cause conflicts
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
