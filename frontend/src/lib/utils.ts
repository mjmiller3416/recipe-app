import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Common fraction mappings for recipe quantities
 */
const FRACTION_MAP: Record<number, string> = {
  0.125: "⅛",
  0.25: "¼",
  0.333: "⅓",
  0.375: "⅜",
  0.5: "½",
  0.625: "⅝",
  0.666: "⅔",
  0.667: "⅔",
  0.75: "¾",
  0.875: "⅞",
};

/**
 * Converts a decimal quantity to a fraction string for display
 * Examples:
 *   0.5 -> "½"
 *   1.5 -> "1 ½"
 *   0.25 -> "¼"
 *   2 -> "2"
 *   null -> ""
 */
export function formatQuantity(quantity: number | null): string {
  if (quantity === null || quantity === undefined) return "";
  if (quantity === 0) return "0";

  const whole = Math.floor(quantity);
  const decimal = Math.round((quantity - whole) * 1000) / 1000;

  // Find matching fraction
  let fraction = "";
  for (const [dec, frac] of Object.entries(FRACTION_MAP)) {
    if (Math.abs(decimal - parseFloat(dec)) < 0.01) {
      fraction = frac;
      break;
    }
  }

  if (whole === 0 && fraction) {
    return fraction;
  } else if (whole > 0 && fraction) {
    return `${whole} ${fraction}`;
  } else if (whole > 0) {
    // No matching fraction, return decimal if there's a remainder
    return decimal > 0 ? quantity.toString() : whole.toString();
  }

  return quantity.toString();
}

/**
 * Converts a base64 data URL or raw base64 string to a File object
 * Useful for converting AI-generated images to uploadable files
 *
 * @param base64Data - Base64 encoded data (with or without data URL prefix)
 * @param filename - The filename to use for the File object
 * @param mimeType - The MIME type (defaults to image/png)
 * @returns A File object that can be uploaded
 */
export function base64ToFile(
  base64Data: string,
  filename: string,
  mimeType: string = "image/png"
): File {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Content = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;

  // Decode base64 to binary
  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);

  // Create blob and file
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}
