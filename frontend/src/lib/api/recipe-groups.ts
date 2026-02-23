import type {
  RecipeGroupResponseDTO,
  RecipeGroupCreateDTO,
  RecipeGroupUpdateDTO,
  RecipeGroupAssignmentDTO,
} from "@/types/recipe";
import { fetchApi } from "./base";

export const recipeGroupApi = {
  /**
   * List all recipe groups for the current user
   * @param token - Auth token for authenticated requests
   * @returns Array of recipe groups with recipe counts
   */
  list: (token: string | null): Promise<RecipeGroupResponseDTO[]> =>
    fetchApi<RecipeGroupResponseDTO[]>("/api/recipe-groups", undefined, token),

  /**
   * Get a single recipe group by ID
   * @param id - Group ID
   * @param token - Auth token for authenticated requests
   * @returns Recipe group details
   */
  get: (id: number, token: string | null): Promise<RecipeGroupResponseDTO> =>
    fetchApi<RecipeGroupResponseDTO>(`/api/recipe-groups/${id}`, undefined, token),

  /**
   * Create a new recipe group
   * @param data - Group data (name)
   * @param token - Auth token for authenticated requests
   * @returns Created recipe group
   */
  create: (data: RecipeGroupCreateDTO, token: string | null): Promise<RecipeGroupResponseDTO> =>
    fetchApi<RecipeGroupResponseDTO>(
      "/api/recipe-groups",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Update a recipe group's name
   * @param id - Group ID
   * @param data - Updated group data
   * @param token - Auth token for authenticated requests
   * @returns Updated recipe group
   */
  update: (id: number, data: RecipeGroupUpdateDTO, token: string | null): Promise<RecipeGroupResponseDTO> =>
    fetchApi<RecipeGroupResponseDTO>(
      `/api/recipe-groups/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Delete a recipe group
   * @param id - Group ID
   * @param token - Auth token for authenticated requests
   */
  delete: (id: number, token: string | null): Promise<void> =>
    fetchApi<void>(
      `/api/recipe-groups/${id}`,
      {
        method: "DELETE",
      },
      token
    ),

  /**
   * Get all groups that contain a specific recipe
   * @param recipeId - Recipe ID
   * @param token - Auth token for authenticated requests
   * @returns Array of groups containing this recipe
   */
  getGroupsForRecipe: (recipeId: number, token: string | null): Promise<RecipeGroupResponseDTO[]> =>
    fetchApi<RecipeGroupResponseDTO[]>(
      `/api/recipe-groups/by-recipe/${recipeId}`,
      undefined,
      token
    ),

  /**
   * Assign a recipe to specific groups (replaces existing assignments)
   * @param recipeId - Recipe ID
   * @param data - Group IDs to assign
   * @param token - Auth token for authenticated requests
   * @returns Updated list of groups for the recipe
   */
  assignRecipeToGroups: (
    recipeId: number,
    data: RecipeGroupAssignmentDTO,
    token: string | null
  ): Promise<RecipeGroupResponseDTO[]> =>
    fetchApi<RecipeGroupResponseDTO[]>(
      `/api/recipe-groups/by-recipe/${recipeId}/assign`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Add a recipe to a group
   * @param groupId - Group ID
   * @param recipeId - Recipe ID
   * @param token - Auth token for authenticated requests
   * @returns Updated recipe group
   */
  addRecipeToGroup: (
    groupId: number,
    recipeId: number,
    token: string | null
  ): Promise<RecipeGroupResponseDTO> =>
    fetchApi<RecipeGroupResponseDTO>(
      `/api/recipe-groups/${groupId}/recipes/${recipeId}`,
      {
        method: "POST",
      },
      token
    ),

  /**
   * Remove a recipe from a group
   * @param groupId - Group ID
   * @param recipeId - Recipe ID
   * @param token - Auth token for authenticated requests
   * @returns Updated recipe group
   */
  removeRecipeFromGroup: (
    groupId: number,
    recipeId: number,
    token: string | null
  ): Promise<RecipeGroupResponseDTO> =>
    fetchApi<RecipeGroupResponseDTO>(
      `/api/recipe-groups/${groupId}/recipes/${recipeId}`,
      {
        method: "DELETE",
      },
      token
    ),
};
