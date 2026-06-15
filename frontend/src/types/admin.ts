// Admin panel types matching backend DTOs

export interface CurrentUserDTO {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  subscription_tier: string;
  has_pro_access: boolean;
  access_reason: string;
}

export interface AdminUserDTO {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  subscription_status: string;
  is_admin: boolean;
  has_pro_access: boolean;
  access_reason: string;
  granted_pro_until: string | null;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserListResponse {
  items: AdminUserDTO[];
  total: number;
}

export interface AdminGrantProRequest {
  granted_pro_until: string;
  granted_by: string;
}

export interface AdminToggleAdminRequest {
  is_admin: boolean;
}

export type FeedbackStatus = "new" | "read" | "in_progress" | "resolved";

export interface AdminFeedbackListItem {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string | null;
  category: string;
  message_preview: string;
  status: FeedbackStatus;
  created_at: string;
}

export interface AdminFeedbackDetail {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string | null;
  category: string;
  message: string;
  metadata_json: Record<string, unknown> | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
}

export interface AdminFeedbackListResponse {
  items: AdminFeedbackListItem[];
  total: number;
}

export interface AdminFeedbackUpdateRequest {
  status?: FeedbackStatus;
  admin_notes?: string;
}
