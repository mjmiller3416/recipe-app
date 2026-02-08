import type {
  UnitsResponseDTO,
  UnitConversionRuleDTO,
  UnitConversionRuleCreateDTO,
} from "@/types/common";
import { fetchApi } from "./base";

export const unitConversionApi = {
  /**
   * Get all available ingredient units
   * @param token - Optional auth token for authenticated requests
   */
  getUnits: (token?: string | null): Promise<UnitsResponseDTO> =>
    fetchApi<UnitsResponseDTO>("/api/unit-conversions/units", undefined, token),

  /**
   * List all unit conversion rules
   * @param token - Optional auth token for authenticated requests
   */
  list: (token?: string | null): Promise<UnitConversionRuleDTO[]> =>
    fetchApi<UnitConversionRuleDTO[]>("/api/unit-conversions", undefined, token),

  /**
   * Get a single rule by ID
   * @param id - Rule ID
   * @param token - Optional auth token for authenticated requests
   */
  get: (id: number, token?: string | null): Promise<UnitConversionRuleDTO> =>
    fetchApi<UnitConversionRuleDTO>(`/api/unit-conversions/${id}`, undefined, token),

  /**
   * Create a new unit conversion rule
   * @param data - Rule data
   * @param token - Optional auth token for authenticated requests
   */
  create: (data: UnitConversionRuleCreateDTO, token?: string | null): Promise<UnitConversionRuleDTO> =>
    fetchApi<UnitConversionRuleDTO>(
      "/api/unit-conversions",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),

  /**
   * Delete a unit conversion rule
   * @param id - Rule ID
   * @param token - Optional auth token for authenticated requests
   */
  delete: (id: number, token?: string | null): Promise<void> =>
    fetchApi<void>(
      `/api/unit-conversions/${id}`,
      {
        method: "DELETE",
      },
      token
    ),
};
