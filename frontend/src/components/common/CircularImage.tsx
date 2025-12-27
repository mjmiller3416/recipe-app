"use client";

import { useState } from "react";
import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

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
 * CircularImage - A reusable circular image component with error handling
 *
 * Features:
 * - Circular clipping with overflow-hidden
 * - Placeholder with ChefHat icon when no image or load error
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
  const [hasError, setHasError] = useState(false);

  const showPlaceholder = !src || hasError;

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-elevated flex-shrink-0",
        SIZE_MAP[size],
        className
      )}
    >
      {showPlaceholder ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-elevated via-hover to-elevated">
          <ChefHat
            className={cn(ICON_SIZE_MAP[size], "text-muted-foreground opacity-40")}
          />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn("w-full h-full object-cover transition-opacity duration-300", imageClassName)}
          style={zoom !== 1 ? { transform: `scale(${zoom})` } : undefined}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
