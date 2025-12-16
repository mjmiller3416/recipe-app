// components/RecipeImage.tsx
// A wrapper for recipe images with built-in error handling and placeholder fallback

"use client";

import { useState } from "react";
import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecipeImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  iconSize?: "sm" | "md" | "lg" | "xl";
}

const ICON_SIZES = {
  sm: "h-6 w-6",
  md: "h-12 w-12",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
};

/**
 * RecipeImage component with automatic fallback to placeholder on error
 * 
 * Features:
 * - Shows placeholder if src is undefined/empty
 * - Shows placeholder if image fails to load (404, network error, etc.)
 * - Smooth transitions between loading states
 * - Consistent placeholder styling across the app
 */
export function RecipeImage({
  src,
  alt,
  className,
  placeholderClassName,
  iconSize = "lg",
}: RecipeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Show placeholder if no src or if there was an error loading the image
  const showPlaceholder = !src || hasError;

  if (showPlaceholder) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center",
          "bg-gradient-to-br from-elevated via-hover to-elevated",
          placeholderClassName
        )}
      >
        <ChefHat className={cn(ICON_SIZES[iconSize], "text-muted opacity-40")} />
      </div>
    );
  }

  return (
    <>
      {/* Loading placeholder - shown until image loads */}
      {!isLoaded && (
        <div
          className={cn(
            "absolute inset-0 w-full h-full flex items-center justify-center",
            "bg-gradient-to-br from-elevated via-hover to-elevated",
            placeholderClassName
          )}
        >
          <ChefHat className={cn(ICON_SIZES[iconSize], "text-muted opacity-40 animate-pulse")} />
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className={cn(
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

/**
 * Simplified version for use in RecipeCard where we just need error handling
 * This can be used as a drop-in replacement for the current img tags
 */
export function RecipeCardImage({
  src,
  alt,
  className,
  iconSize = "lg",
}: Omit<RecipeImageProps, "placeholderClassName">) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-elevated via-hover to-elevated">
        <ChefHat className={cn(ICON_SIZES[iconSize], "text-muted opacity-40")} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

/**
 * Hero image component for recipe detail pages
 * Features gradient overlay and responsive height
 * Accepts children for overlay elements (back button, favorite button, etc.)
 */
interface RecipeHeroImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}

export function RecipeHeroImage({ src, alt, className, children }: RecipeHeroImageProps) {
  const [hasError, setHasError] = useState(false);

  const showPlaceholder = !src || hasError;

  return (
    <div
      className={cn(
        "relative h-[300px] md:h-[400px] bg-elevated overflow-hidden",
        className
      )}
    >
      {showPlaceholder ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-elevated via-hover to-elevated">
          <ChefHat className="h-32 w-32 text-muted opacity-30" />
        </div>
      ) : (
        <>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </>
      )}
      {children}
    </div>
  );
}
