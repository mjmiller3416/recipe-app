import type {
  IngredientResponseDTO,
  IngredientCreateDTO,
  IngredientSearchDTO,
} from "@/types/recipe";
import { fetchApi, buildQueryString } from "./client";

export const ingredientApi = {
  /**
   * List or search ingredients
   * @param params - Optional search parameters
   * @param token - Optional auth token for authenticated requests
   */
  list: (
    params?: {
      search_term?: string;
      category?: string;
      limit?: number;
      offset?: number;
    },
    token?: string | null
  ): Promise<IngredientResponseDTO[]> => {
    const query = params ? buildQueryString(params) : "";
    return fetchApi<IngredientResponseDTO[]>(`/api/ingredients${query}`, undefined, token);
  },

  /**
   * Get ingredient categories
   * @param token - Optional auth token for authenticated requests
   */
  getCategories: (token?: string | null): Promise<string[]> =>
    fetchApi<string[]>("/api/ingredients/categories", undefined, token),

  /**
   * Get ingredient names for autocomplete
   * @param token - Optional auth token for authenticated requests
   */
  getNames: (token?: string | null): Promise<string[]> =>
    fetchApi<string[]>("/api/ingredients/names", undefined, token),

  /**
   * Get a single ingredient
   * @param id - Ingredient ID
   * @param token - Optional auth token for authenticated requests
   */
  get: (id: number, token?: string | null): Promise<IngredientResponseDTO> =>
    fetchApi<IngredientResponseDTO>(`/api/ingredients/${id}`, undefined, token),

  /**
   * Create a new ingredient
   * @param data - Ingredient data
   * @param token - Optional auth token for authenticated requests
   */
  create: (data: IngredientCreateDTO, token?: string | null): Promise<IngredientResponseDTO> =>
    fetchApi<IngredientResponseDTO>(
      "/api/ingredients",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Search ingredients
   * @param data - Search parameters
   * @param token - Optional auth token for authenticated requests
   */
  search: (data: IngredientSearchDTO, token?: string | null): Promise<IngredientResponseDTO[]> =>
    fetchApi<IngredientResponseDTO[]>(
      "/api/ingredients/search",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),
};
