import type {
  UserCategoryDTO,
  UserCategoryCreateDTO,
  UserCategoryUpdateDTO,
  UserCategoryReorderDTO,
  UserCategoryBulkUpdateDTO,
} from "@/types/category";
import { fetchApi } from "./base";

export const categoryApi = {
  /**
   * List all categories for the current user
   * @param token - Auth token for authenticated requests
   * @param includeDisabled - Include disabled categories (default: false)
   * @returns Array of user categories ordered by position
   */
  list: (
    token: string | null,
    includeDisabled = false
  ): Promise<UserCategoryDTO[]> =>
    fetchApi<UserCategoryDTO[]>(
      `/api/categories${includeDisabled ? "?include_disabled=true" : ""}`,
      undefined,
      token
    ),

  /**
   * Get a single category by ID
   * @param id - Category ID
   * @param token - Auth token for authenticated requests
   * @returns Category details
   */
  get: (id: number, token: string | null): Promise<UserCategoryDTO> =>
    fetchApi<UserCategoryDTO>(`/api/categories/${id}`, undefined, token),

  /**
   * Create a new custom category
   * @param data - Category data (label)
   * @param token - Auth token for authenticated requests
   * @returns Created category
   */
  create: (
    data: UserCategoryCreateDTO,
    token: string | null
  ): Promise<UserCategoryDTO> =>
    fetchApi<UserCategoryDTO>(
      "/api/categories",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Update a category
   * @param id - Category ID
   * @param data - Updated category data
   * @param token - Auth token for authenticated requests
   * @returns Updated category
   */
  update: (
    id: number,
    data: UserCategoryUpdateDTO,
    token: string | null
  ): Promise<UserCategoryDTO> =>
    fetchApi<UserCategoryDTO>(
      `/api/categories/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Delete a custom category
   * @param id - Category ID
   * @param token - Auth token for authenticated requests
   */
  delete: (id: number, token: string | null): Promise<void> =>
    fetchApi<void>(
      `/api/categories/${id}`,
      {
        method: "DELETE",
      },
      token
    ),

  /**
   * Reorder categories
   * @param data - Ordered list of category IDs
   * @param token - Auth token for authenticated requests
   * @returns All categories with updated positions
   */
  reorder: (
    data: UserCategoryReorderDTO,
    token: string | null
  ): Promise<UserCategoryDTO[]> =>
    fetchApi<UserCategoryDTO[]>(
      "/api/categories/reorder",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Bulk update multiple categories
   * @param data - List of category updates
   * @param token - Auth token for authenticated requests
   * @returns All categories with updated states
   */
  bulkUpdate: (
    data: UserCategoryBulkUpdateDTO,
    token: string | null
  ): Promise<UserCategoryDTO[]> =>
    fetchApi<UserCategoryDTO[]>(
      "/api/categories/bulk",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Reset categories to defaults
   * @param token - Auth token for authenticated requests
   * @returns All categories with reset states
   */
  reset: (token: string | null): Promise<UserCategoryDTO[]> =>
    fetchApi<UserCategoryDTO[]>(
      "/api/categories/reset",
      {
        method: "POST",
      },
      token
    ),
};
