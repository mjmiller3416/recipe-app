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

// Database query types

export interface AdminQueryRequest {
  query: string;
}

export interface AdminQueryResponse {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  row_count: number;
  execution_time_ms: number;
}
