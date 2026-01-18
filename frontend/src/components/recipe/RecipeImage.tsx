// components/RecipeImage.tsx
// A unified recipe image component with error handling and placeholder fallback

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
          "text-muted-foreground opacity-40",
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
 * - Direct: <RecipeImage src={url} alt="..." /> for most components
 * - For grids/lists: use showLoadingState={false} for better performance
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
