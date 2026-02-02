import type { DashboardStatsDTO } from "@/types/common";
import { fetchApi } from "./client";

export const dashboardApi = {
  /**
   * Get lightweight dashboard statistics (counts only)
   * @param token - Optional auth token for authenticated requests
   * @returns Dashboard stats with recipe, meal, and shopping counts
   */
  getStats: (token?: string | null): Promise<DashboardStatsDTO> =>
    fetchApi<DashboardStatsDTO>("/api/dashboard/stats", undefined, token),
};
