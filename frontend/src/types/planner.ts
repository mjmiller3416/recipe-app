// src/types/planner.ts

import type { RecipeCardDTO } from "./recipe";
import type { ShoppingMode } from "./shopping";

// ============================================================================
// Planner Types
// ============================================================================

/**
 * Planner entry with hydrated meal data.
 * Represents a meal added to the weekly planner.
 */
export interface PlannerEntryResponseDTO {
  id: number;
  meal_id: number;
  position: number;
  is_completed: boolean;
  completed_at: string | null;
  scheduled_date: string | null;
  shopping_mode?: ShoppingMode;
  // Hydrated meal data
  meal_name: string | null;
  meal_is_saved?: boolean;
  main_recipe_id: number | null;
  side_recipe_ids: number[];
  main_recipe: RecipeCardDTO | null;
}
