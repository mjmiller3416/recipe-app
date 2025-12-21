// components/RecipeImage.tsx
// A unified recipe image component with error handling and placeholder fallback
// This is the foundation component - use directly or via convenience wrappers

"use client";

import { useState } from "react";
import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface RecipeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  iconSize?: "sm" | "md" | "lg" | "xl";
  fill?: boolean;
  /**
   * Show animated loading state while image loads.
   * Set to false for lists/grids where many images render at once.
   * @default true
   */
  showLoadingState?: boolean;
}

interface RecipeHeroImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ICON_SIZES = {
  sm: "h-6 w-6",
  md: "h-12 w-12",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
};

// ============================================================================
// INTERNAL COMPONENTS
// ============================================================================

/**
 * Placeholder component - displays ChefHat icon with gradient background
 * Used for empty states and loading states
 */
function ImagePlaceholder({
  iconSize = "lg",
  animate = false,
  fill = false,
  className,
}: {
  iconSize?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  fill?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center",
        "bg-gradient-to-br from-elevated via-hover to-elevated",
        fill && "absolute inset-0",
        className
      )}
    >
      <ChefHat
        className={cn(
          ICON_SIZES[iconSize],
          "text-muted opacity-40",
          animate && "animate-pulse"
        )}
      />
    </div>
  );
}

// ============================================================================
// RECIPE IMAGE - Foundation Component
// ============================================================================

/**
 * RecipeImage - The foundation component for all recipe images
 *
 * Features:
 * - Shows placeholder if src is undefined/empty
 * - Shows placeholder if image fails to load (404, network error, etc.)
 * - Optional smooth loading transitions with animated placeholder
 * - Consistent placeholder styling across the app
 *
 * Usage:
 * - Direct: <RecipeImage src={url} alt="..." /> for custom components
 * - Via RecipeCardImage: optimized for card grids (no loading animation)
 * - Via RecipeHeroImage: for detail page heroes (with gradient overlay)
 */
export function RecipeImage({
  src,
  alt,
  className,
  placeholderClassName,
  iconSize = "lg",
  fill = false,
  showLoadingState = true,
}: RecipeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Show placeholder if no src or if there was an error loading the image
  const showPlaceholder = !src || hasError;

  // Classes for fill mode (absolute positioning to fill container)
  const fillClasses = fill ? "absolute inset-0 w-full h-full object-cover" : "";

  // Empty/error state - show static placeholder
  if (showPlaceholder) {
    return (
      <ImagePlaceholder
        iconSize={iconSize}
        fill={fill}
        className={placeholderClassName}
      />
    );
  }

  // Without loading state - simple render (optimized for lists/grids)
  if (!showLoadingState) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(fillClasses, className)}
        onError={() => setHasError(true)}
      />
    );
  }

  // With loading state - animated transition
  return (
    <>
      {!isLoaded && (
        <div className={cn("absolute inset-0", placeholderClassName)}>
          <ImagePlaceholder iconSize={iconSize} animate />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={cn(
          fillClasses,
          className,
          !isLoaded && "opacity-0",
          isLoaded && "opacity-100",
          "transition-opacity duration-300"
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </>
  );
}

// ============================================================================
// RECIPE CARD IMAGE - Convenience Wrapper for Cards
// ============================================================================

/**
 * RecipeCardImage - Optimized for recipe cards in lists/grids
 *
 * This is a thin wrapper around RecipeImage with:
 * - Loading animation disabled (better performance for many images)
 * - Simplified props (no placeholderClassName needed)
 *
 * Use this in RecipeCard components (small, medium, large variants)
 */
export function RecipeCardImage({
  src,
  alt,
  className,
  iconSize = "lg",
}: Omit<RecipeImageProps, "placeholderClassName" | "fill" | "showLoadingState">) {
  return (
    <RecipeImage
      src={src}
      alt={alt}
      className={className}
      iconSize={iconSize}
      showLoadingState={false}
    />
  );
}

// ============================================================================
// RECIPE HERO IMAGE - Convenience Wrapper for Detail Pages
// ============================================================================

/**
 * RecipeHeroImage - Hero image for recipe detail pages
 *
 * This wraps RecipeImage with:
 * - Fixed responsive height (300px mobile, 400px desktop)
 * - Gradient overlay for text readability
 * - Children slot for overlay elements (back button, favorite button, etc.)
 *
 * Use this at the top of recipe detail pages
 */
export function RecipeHeroImage({
  src,
  alt,
  className,
  children,
}: RecipeHeroImageProps) {
  return (
    <div
      className={cn(
        "relative h-[300px] md:h-[400px] bg-elevated overflow-hidden",
        className
      )}
    >
      <RecipeImage
        src={src}
        alt={alt}
        fill
        iconSize="xl"
        showLoadingState={false}
        className="w-full h-full object-cover"
      />

      {/* Gradient overlay - only shown when image is present */}
      {src && (
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      )}

      {/* Overlay content (back button, favorite, etc.) */}
      {children}
    </div>
  );
}
