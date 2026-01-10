import { INGREDIENT_CATEGORY_ORDER } from "@/lib/constants";
import type { RecipeResponseDTO } from "@/types";

/**
 * Formats minutes into a human-readable time string.
 * @example formatTime(90) // "1h 30m"
 * @example formatTime(45) // "45 min"
 */
export function formatTime(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Parses recipe directions string into an array of step strings.
 * Handles numbered steps (1., 1)) and newline-separated steps.
 */
export function parseDirections(directions: string | null): string[] {
  if (!directions) return [];

  // Split by numbered steps (1. 2. etc.) or by newlines
  const steps = directions
    .split(/\n/)
    .map(step => step.trim())
    .filter(step => step.length > 0)
    .map(step => {
      // Remove leading numbers like "1." or "1)"
      return step.replace(/^\d+[\.\)]\s*/, "");
    });

  return steps;
}

/**
 * Groups ingredients by their category for organized display.
 * @returns Map with category names as keys and ingredient arrays as values
 */
export function groupIngredientsByCategory(
  ingredients: RecipeResponseDTO["ingredients"]
): Map<string, RecipeResponseDTO["ingredients"]> {
  const grouped = new Map<string, RecipeResponseDTO["ingredients"]>();

  ingredients.forEach(ing => {
    const category = ing.ingredient_category || "Other";
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(ing);
  });

  return grouped;
}

/**
 * Sorts category entries by priority order (Meat first, then logical order).
 * Unknown categories are sorted to the end.
 */
export function sortCategoryEntries(
  entries: [string, RecipeResponseDTO["ingredients"]][]
): [string, RecipeResponseDTO["ingredients"]][] {
  return entries.sort(([a], [b]) => {
    const aIndex = INGREDIENT_CATEGORY_ORDER.indexOf(a.toLowerCase() as typeof INGREDIENT_CATEGORY_ORDER[number]);
    const bIndex = INGREDIENT_CATEGORY_ORDER.indexOf(b.toLowerCase() as typeof INGREDIENT_CATEGORY_ORDER[number]);
    // Unknown categories go to the end
    const aOrder = aIndex === -1 ? INGREDIENT_CATEGORY_ORDER.length : aIndex;
    const bOrder = bIndex === -1 ? INGREDIENT_CATEGORY_ORDER.length : bIndex;
    return aOrder - bOrder;
  });
}
