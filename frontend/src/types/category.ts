/**
 * User Category Types
 *
 * DTOs for user-customizable recipe categories.
 */

// -- Response DTO ---------------------------------------------------------------------------------
export interface UserCategoryDTO {
  id: number;
  value: string;
  label: string;
  is_custom: boolean;
  is_enabled: boolean;
  position: number;
}

// -- Create DTO -----------------------------------------------------------------------------------
export interface UserCategoryCreateDTO {
  label: string;
}

// -- Update DTO -----------------------------------------------------------------------------------
export interface UserCategoryUpdateDTO {
  label?: string;
  is_enabled?: boolean;
}

// -- Reorder DTO ----------------------------------------------------------------------------------
export interface UserCategoryReorderDTO {
  ordered_ids: number[];
}

// -- Bulk Update DTOs -----------------------------------------------------------------------------
export interface UserCategoryBulkItemDTO {
  id: number;
  is_enabled: boolean;
  position: number;
}

export interface UserCategoryBulkUpdateDTO {
  categories: UserCategoryBulkItemDTO[];
}

// -- UI Convenience Types -------------------------------------------------------------------------
export interface CategoryOption {
  value: string;
  label: string;
}
