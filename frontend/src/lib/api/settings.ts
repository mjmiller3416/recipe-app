import { fetchApi } from "./base";

export const settingsApi = {
  /**
   * Get current user's settings
   * @param token - Auth token for authenticated requests
   * @returns User settings object
   */
  get: (token: string | null): Promise<Record<string, unknown>> =>
    fetchApi<Record<string, unknown>>("/api/settings", undefined, token),

  /**
   * Replace all user settings with provided values
   * @param settings - Complete settings object
   * @param token - Auth token for authenticated requests
   * @returns Updated settings object
   */
  replace: (settings: Record<string, unknown>, token: string | null): Promise<Record<string, unknown>> =>
    fetchApi<Record<string, unknown>>(
      "/api/settings",
      {
        method: "PUT",
        body: JSON.stringify(settings),
      },
      token
    ),

  /**
   * Merge provided settings with existing settings (partial update)
   * @param partialSettings - Partial settings to merge
   * @param token - Auth token for authenticated requests
   * @returns Updated settings object
   */
  update: (partialSettings: Record<string, unknown>, token: string | null): Promise<Record<string, unknown>> =>
    fetchApi<Record<string, unknown>>(
      "/api/settings",
      {
        method: "PATCH",
        body: JSON.stringify(partialSettings),
      },
      token
    ),
};
