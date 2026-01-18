// lib/imageUtils.ts
// Utility functions for handling recipe images

/**
 * Default placeholder image path for recipes without images
 */
export const DEFAULT_RECIPE_PLACEHOLDER = "/images/recipes/placeholder.svg";

/**
 * Check if a path is a valid web-accessible URL or relative path
 */
function isValidWebPath(path: string | null | undefined): boolean {
  if (!path) return false;
  
  // Valid if it starts with / (relative path) or http/https (absolute URL)
  return path.startsWith("/") || path.startsWith("http://") || path.startsWith("https://");
}

/**
 * Check if a path is a local filesystem path (from old Python app)
 * These paths won't work in the browser and should be treated as missing
 */
function isLocalFilesystemPath(path: string): boolean {
  // Windows paths: C:\, D:\, etc.
  if (/^[A-Za-z]:\\/.test(path)) return true;
  
  // Unix absolute paths that aren't web paths
  // (web paths start with / but are served by the web server, not filesystem)
  // We'll consider paths with common local indicators as local
  if (path.includes("\\")) return true;
  if (path.startsWith("/Users/")) return true;
  if (path.startsWith("/home/")) return true;
  if (path.includes("/user_data/")) return true;
  
  return false;
}

/**
 * Transform a recipe image path to a valid web URL
 * 
 * @param path - The image path from the database (could be local path, relative path, or URL)
 * @returns A valid web URL or undefined if the path is invalid/missing
 * 
 * Path handling:
 * - null/undefined → undefined (will show placeholder)
 * - Local filesystem path (C:\..., /Users/...) → undefined (can't load in browser)
 * - Relative path (/images/recipes/...) → returns as-is
 * - Full URL (https://...) → returns as-is
 * 
 * For local development with Option A:
 * - Store images in: frontend/public/images/recipes/
 * - Database stores: /images/recipes/recipe-name.jpg
 * - Browser loads: http://localhost:3000/images/recipes/recipe-name.jpg
 */
export function getRecipeImageUrl(path: string | null | undefined): string | undefined {
  // No path provided
  if (!path || path.trim() === "") {
    return undefined;
  }

  // Check if it's a local filesystem path (from old Python app)
  if (isLocalFilesystemPath(path)) {
    // Can't use local paths in browser - treat as missing
    console.debug(`[imageUtils] Skipping local filesystem path: ${path.substring(0, 50)}...`);
    return undefined;
  }

  // Check if it's a valid web-accessible path
  if (isValidWebPath(path)) {
    return path;
  }

  // Unknown format - treat as missing
  console.warn(`[imageUtils] Unknown image path format: ${path}`);
  return undefined;
}

/**
 * Get the image URL with fallback to placeholder
 * Use this when you always want an image URL (never undefined)
 */
export function getRecipeImageUrlWithFallback(path: string | null | undefined): string {
  return getRecipeImageUrl(path) ?? DEFAULT_RECIPE_PLACEHOLDER;
}

/**
 * Generate the expected image path for a recipe
 * Use this when saving new recipes to generate consistent paths
 * 
 * @param recipeId - The recipe ID
 * @param extension - File extension (default: jpg)
 * @returns The relative path to store in the database
 */
export function generateRecipeImagePath(recipeId: number | string, extension = "jpg"): string {
  return `/images/recipes/${recipeId}.${extension}`;
}

/**
 * Generate a banner image path for a recipe
 */
export function generateRecipeBannerPath(recipeId: number | string, extension = "jpg"): string {
  return `/images/recipes/${recipeId}-banner.${extension}`;
}

// ============================================================================
// CLOUDINARY TRANSFORMATIONS
// ============================================================================

/**
 * Check if a URL is a Cloudinary URL
 */
function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

/**
 * Transform a Cloudinary URL to apply on-the-fly image transformations.
 *
 * Cloudinary URLs follow this structure:
 * https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
 *
 * With transformations:
 * https://res.cloudinary.com/{cloud}/image/upload/{transformations}/v{version}/{public_id}.{ext}
 *
 * @param url - The original Cloudinary URL
 * @param transformations - Cloudinary transformation string (e.g., "w_1200,h_400,c_fill,g_auto")
 * @returns The transformed URL, or original URL if not a Cloudinary URL
 */
function applyCloudinaryTransformation(url: string, transformations: string): string {
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  // Find the /upload/ segment and insert transformations after it
  const uploadSegment = "/upload/";
  const uploadIndex = url.indexOf(uploadSegment);

  if (uploadIndex === -1) {
    return url;
  }

  const insertPosition = uploadIndex + uploadSegment.length;
  return url.slice(0, insertPosition) + transformations + "/" + url.slice(insertPosition);
}

/**
 * Transform an image URL for hero/banner display.
 *
 * For Cloudinary images: Applies smart crop (g_auto) to intelligently
 * detect the subject and crop to banner dimensions.
 *
 * For non-Cloudinary images: Returns the original URL unchanged.
 * The CSS object-cover will handle the cropping (existing behavior).
 *
 * @param url - The original image URL (can be Cloudinary or local)
 * @returns URL optimized for banner display
 *
 * @example
 * // Cloudinary URL gets smart crop transformation
 * getHeroBannerUrl("https://res.cloudinary.com/.../upload/v123/image.jpg")
 * // → "https://res.cloudinary.com/.../upload/w_1200,h_400,c_fill,g_auto,q_auto/v123/image.jpg"
 *
 * // Local URL passes through unchanged
 * getHeroBannerUrl("/images/recipes/123.jpg")
 * // → "/images/recipes/123.jpg"
 */
export function getHeroBannerUrl(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  // Only apply transformations to Cloudinary URLs
  if (isCloudinaryUrl(url)) {
    // w_1200: width 1200px (good for most screens)
    // h_400: height 400px (matches our hero container)
    // c_fill: fill the dimensions, cropping as needed
    // g_auto: AI-powered gravity - finds the subject automatically
    // q_auto: automatic quality optimization
    return applyCloudinaryTransformation(url, "w_1200,h_400,c_fill,g_auto/q_auto");
  }

  // Non-Cloudinary URLs pass through unchanged
  return url;
}

/**
 * Transform an image URL for recipe card display with AI-powered cropping.
 *
 * Uses Cloudinary's g_auto to intelligently focus on the main subject,
 * ensuring the main subject stays visible even when cropped to different aspect ratios.
 *
 * @param url - The original image URL
 * @param width - Target width (default: 400)
 * @param height - Target height (default: 300)
 * @returns URL optimized for card display
 */
export function getRecipeCardUrl(
  url: string | null | undefined,
  width = 400,
  height = 300
): string | undefined {
  if (!url) {
    return undefined;
  }

  if (isCloudinaryUrl(url)) {
    // c_fill: fill dimensions, cropping as needed
    // g_auto: AI-powered smart cropping (finds subject automatically)
    return applyCloudinaryTransformation(url, `w_${width},h_${height},c_fill,g_auto`);
  }

  return url;
}
