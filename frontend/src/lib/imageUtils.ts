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
