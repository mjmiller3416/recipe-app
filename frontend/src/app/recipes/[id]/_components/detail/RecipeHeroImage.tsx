"use client";

import { cn } from "@/lib/utils";
import { getHeroBannerUrl } from "@/lib/imageUtils";
import { RecipeImage } from "@/components/recipe/RecipeImage";

interface RecipeHeroImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * RecipeHeroImage - Hero image for recipe detail pages
 *
 * Features:
 * - Fixed responsive height (300px mobile, 400px desktop)
 * - Gradient overlay for text readability
 * - Children slot for overlay elements (back button, favorite button, etc.)
 * - Smart crop for Cloudinary images (uses g_auto to detect subject)
 */
export function RecipeHeroImage({
  src,
  alt,
  className,
  children,
}: RecipeHeroImageProps) {
  // Transform Cloudinary URLs to use smart crop for banner dimensions
  // This applies AI-powered subject detection to avoid cropping out the dish
  const bannerSrc = getHeroBannerUrl(src);

  return (
    <div
      className={cn(
        "relative h-[300px] md:h-[400px] bg-elevated overflow-hidden",
        className
      )}
    >
      <RecipeImage
        src={bannerSrc}
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
