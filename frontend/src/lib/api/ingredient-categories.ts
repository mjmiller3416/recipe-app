import type {
  UserIngredientCategoryDTO,
  UserIngredientCategoryCreateDTO,
  UserIngredientCategoryUpdateDTO,
  UserIngredientCategoryReorderDTO,
  UserIngredientCategoryBulkUpdateDTO,
} from "@/types/ingredient-settings";
import { fetchApi } from "./base";

export const ingredientCategoryApi = {
  list: (
    token: string | null,
    includeDisabled = false
  ): Promise<UserIngredientCategoryDTO[]> =>
    fetchApi<UserIngredientCategoryDTO[]>(
      `/api/ingredient-categories${includeDisabled ? "?include_disabled=true" : ""}`,
      undefined,
      token
    ),

  get: (id: number, token: string | null): Promise<UserIngredientCategoryDTO> =>
    fetchApi<UserIngredientCategoryDTO>(`/api/ingredient-categories/${id}`, undefined, token),

  create: (
    data: UserIngredientCategoryCreateDTO,
    token: string | null
  ): Promise<UserIngredientCategoryDTO> =>
    fetchApi<UserIngredientCategoryDTO>(
      "/api/ingredient-categories",
      { method: "POST", body: JSON.stringify(data) },
      token
    ),

  update: (
    id: number,
    data: UserIngredientCategoryUpdateDTO,
    token: string | null
  ): Promise<UserIngredientCategoryDTO> =>
    fetchApi<UserIngredientCategoryDTO>(
      `/api/ingredient-categories/${id}`,
      { method: "PUT", body: JSON.stringify(data) },
      token
    ),

  delete: (id: number, token: string | null): Promise<void> =>
    fetchApi<void>(
      `/api/ingredient-categories/${id}`,
      { method: "DELETE" },
      token
    ),

  reorder: (
    data: UserIngredientCategoryReorderDTO,
    token: string | null
  ): Promise<UserIngredientCategoryDTO[]> =>
    fetchApi<UserIngredientCategoryDTO[]>(
      "/api/ingredient-categories/reorder",
      { method: "PUT", body: JSON.stringify(data) },
      token
    ),

  bulkUpdate: (
    data: UserIngredientCategoryBulkUpdateDTO,
    token: string | null
  ): Promise<UserIngredientCategoryDTO[]> =>
    fetchApi<UserIngredientCategoryDTO[]>(
      "/api/ingredient-categories/bulk",
      { method: "PUT", body: JSON.stringify(data) },
      token
    ),

  reset: (token: string | null): Promise<UserIngredientCategoryDTO[]> =>
    fetchApi<UserIngredientCategoryDTO[]>(
      "/api/ingredient-categories/reset",
      { method: "POST" },
      token
    ),
};
