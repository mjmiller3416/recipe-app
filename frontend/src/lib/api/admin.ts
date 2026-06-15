import type {
  CurrentUserDTO,
  AdminUserListResponse,
  AdminUserDTO,
  AdminGrantProRequest,
  AdminToggleAdminRequest,
  AdminFeedbackListResponse,
  AdminFeedbackDetail,
  AdminFeedbackUpdateRequest,
} from "@/types/admin";
import { fetchApi, buildQueryString } from "./base";

export const adminApi = {
  // ── Current User ──────────────────────────────────────────────────────────

  getCurrentUser: (token?: string | null): Promise<CurrentUserDTO> =>
    fetchApi<CurrentUserDTO>("/api/users/me", undefined, token),

  // ── User Management ───────────────────────────────────────────────────────

  listUsers: (
    params: { skip?: number; limit?: number } = {},
    token?: string | null,
  ): Promise<AdminUserListResponse> =>
    fetchApi<AdminUserListResponse>(
      `/api/admin/users${buildQueryString(params)}`,
      undefined,
      token,
    ),

  grantPro: (
    userId: number,
    data: AdminGrantProRequest,
    token?: string | null,
  ): Promise<AdminUserDTO> =>
    fetchApi<AdminUserDTO>(
      `/api/admin/users/${userId}/pro`,
      { method: "PATCH", body: JSON.stringify(data) },
      token,
    ),

  revokePro: (userId: number, token?: string | null): Promise<AdminUserDTO> =>
    fetchApi<AdminUserDTO>(
      `/api/admin/users/${userId}/pro`,
      { method: "DELETE" },
      token,
    ),

  toggleAdmin: (
    userId: number,
    data: AdminToggleAdminRequest,
    token?: string | null,
  ): Promise<AdminUserDTO> =>
    fetchApi<AdminUserDTO>(
      `/api/admin/users/${userId}/admin`,
      { method: "PATCH", body: JSON.stringify(data) },
      token,
    ),

  deleteUser: (userId: number, token?: string | null): Promise<void> =>
    fetchApi<void>(
      `/api/admin/users/${userId}`,
      { method: "DELETE" },
      token,
    ),

  // ── Feedback Management ───────────────────────────────────────────────────

  listFeedback: (
    params: {
      skip?: number;
      limit?: number;
      category?: string;
      status?: string;
      user_id?: number;
      date_from?: string;
      date_to?: string;
    } = {},
    token?: string | null,
  ): Promise<AdminFeedbackListResponse> =>
    fetchApi<AdminFeedbackListResponse>(
      `/api/admin/feedback${buildQueryString(params)}`,
      undefined,
      token,
    ),

  getFeedback: (
    feedbackId: number,
    token?: string | null,
  ): Promise<AdminFeedbackDetail> =>
    fetchApi<AdminFeedbackDetail>(
      `/api/admin/feedback/${feedbackId}`,
      undefined,
      token,
    ),

  updateFeedback: (
    feedbackId: number,
    data: AdminFeedbackUpdateRequest,
    token?: string | null,
  ): Promise<AdminFeedbackDetail> =>
    fetchApi<AdminFeedbackDetail>(
      `/api/admin/feedback/${feedbackId}`,
      { method: "PATCH", body: JSON.stringify(data) },
      token,
    ),
};
