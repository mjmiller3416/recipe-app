/**
 * User Ingredient Settings Types
 *
 * DTOs for user-customizable ingredient categories and units.
 */

// ============================================================================
// Ingredient Category Types
// ============================================================================

export interface UserIngredientCategoryDTO {
  id: number;
  value: string;
  label: string;
  is_custom: boolean;
  is_enabled: boolean;
  position: number;
}

export interface UserIngredientCategoryCreateDTO {
  label: string;
}

export interface UserIngredientCategoryUpdateDTO {
  label?: string;
  is_enabled?: boolean;
}

export interface UserIngredientCategoryReorderDTO {
  ordered_ids: number[];
}

export interface UserIngredientCategoryBulkItemDTO {
  id: number;
  is_enabled: boolean;
  position: number;
}

export interface UserIngredientCategoryBulkUpdateDTO {
  categories: UserIngredientCategoryBulkItemDTO[];
}

// ============================================================================
// Ingredient Unit Types
// ============================================================================

export interface UserIngredientUnitDTO {
  id: number;
  value: string;
  label: string;
  unit_type: string; // "mass" | "volume" | "count"
  is_custom: boolean;
  is_enabled: boolean;
  position: number;
}

export interface UserIngredientUnitCreateDTO {
  label: string;
}

export interface UserIngredientUnitUpdateDTO {
  label?: string;
  is_enabled?: boolean;
}

export interface UserIngredientUnitReorderDTO {
  ordered_ids: number[];
}

export interface UserIngredientUnitBulkItemDTO {
  id: number;
  is_enabled: boolean;
  position: number;
}

export interface UserIngredientUnitBulkUpdateDTO {
  units: UserIngredientUnitBulkItemDTO[];
}

// ============================================================================
// UI Convenience Types
// ============================================================================

export interface IngredientCategoryOption {
  value: string;
  label: string;
}

export interface IngredientUnitOption {
  value: string;
  label: string;
  unit_type?: string;
}
