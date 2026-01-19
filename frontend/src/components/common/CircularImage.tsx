"use client";

import { cn } from "@/lib/utils";
import { RecipeImage } from "@/components/recipe/RecipeImage";

// ============================================================================
// TYPES
// ============================================================================

interface CircularImageProps {
  /** Image source URL */
  src: string | null | undefined;
  /** Alt text for accessibility */
  alt: string;
  /** Size of the circular image */
  size?: "sm" | "md" | "lg" | "xl";
  /** Zoom level for the image (1 = no zoom, 1.2 = 20% zoom, etc.) */
  zoom?: number;
  /** Additional class names for the container */
  className?: string;
  /** Additional class names for the image */
  imageClassName?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_MAP = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
};

const ICON_SIZE_MAP = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

// ============================================================================
// CIRCULAR IMAGE COMPONENT
// ============================================================================

/**
 * CircularImage - A circular image wrapper using RecipeImage for error handling
 *
 * Features:
 * - Circular clipping with overflow-hidden
 * - Delegates error handling to RecipeImage (ChefHat placeholder)
 * - Multiple size variants (sm, md, lg, xl)
 * - Consistent styling with the design system
 *
 * Usage:
 * <CircularImage src={recipe.imageUrl} alt={recipe.name} size="lg" />
 */
export function CircularImage({
  src,
  alt,
  size = "lg",
  zoom = 1,
  className,
  imageClassName,
}: CircularImageProps) {
  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-elevated flex-shrink-0",
        SIZE_MAP[size],
        className
      )}
    >
      <div
        className="w-full h-full"
        style={zoom !== 1 ? { transform: `scale(${zoom})` } : undefined}
      >
        <RecipeImage
          src={src}
          alt={alt}
          fill
          iconClassName={ICON_SIZE_MAP[size]}
          showLoadingState={false}
          className={cn("transition-opacity duration-300", imageClassName)}
        />
      </div>
    </div>
  );
}