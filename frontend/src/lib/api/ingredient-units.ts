import type {
  UserIngredientUnitDTO,
  UserIngredientUnitCreateDTO,
  UserIngredientUnitUpdateDTO,
  UserIngredientUnitReorderDTO,
  UserIngredientUnitBulkUpdateDTO,
} from "@/types/ingredient-settings";
import { fetchApi } from "./base";

export const ingredientUnitApi = {
  list: (
    token: string | null,
    includeDisabled = false
  ): Promise<UserIngredientUnitDTO[]> =>
    fetchApi<UserIngredientUnitDTO[]>(
      `/api/ingredient-units${includeDisabled ? "?include_disabled=true" : ""}`,
      undefined,
      token
    ),

  get: (id: number, token: string | null): Promise<UserIngredientUnitDTO> =>
    fetchApi<UserIngredientUnitDTO>(`/api/ingredient-units/${id}`, undefined, token),

  create: (
    data: UserIngredientUnitCreateDTO,
    token: string | null
  ): Promise<UserIngredientUnitDTO> =>
    fetchApi<UserIngredientUnitDTO>(
      "/api/ingredient-units",
      { method: "POST", body: JSON.stringify(data) },
      token
    ),

  update: (
    id: number,
    data: UserIngredientUnitUpdateDTO,
    token: string | null
  ): Promise<UserIngredientUnitDTO> =>
    fetchApi<UserIngredientUnitDTO>(
      `/api/ingredient-units/${id}`,
      { method: "PUT", body: JSON.stringify(data) },
      token
    ),

  delete: (id: number, token: string | null): Promise<void> =>
    fetchApi<void>(
      `/api/ingredient-units/${id}`,
      { method: "DELETE" },
      token
    ),

  reorder: (
    data: UserIngredientUnitReorderDTO,
    token: string | null
  ): Promise<UserIngredientUnitDTO[]> =>
    fetchApi<UserIngredientUnitDTO[]>(
      "/api/ingredient-units/reorder",
      { method: "PUT", body: JSON.stringify(data) },
      token
    ),

  bulkUpdate: (
    data: UserIngredientUnitBulkUpdateDTO,
    token: string | null
  ): Promise<UserIngredientUnitDTO[]> =>
    fetchApi<UserIngredientUnitDTO[]>(
      "/api/ingredient-units/bulk",
      { method: "PUT", body: JSON.stringify(data) },
      token
    ),

  reset: (token: string | null): Promise<UserIngredientUnitDTO[]> =>
    fetchApi<UserIngredientUnitDTO[]>(
      "/api/ingredient-units/reset",
      { method: "POST" },
      token
    ),
};
