"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { adminApi } from "@/lib/api";
import { adminQueryKeys, currentUserQueryKeys } from "./queryKeys";
import type {
  AdminGrantProRequest,
  AdminToggleAdminRequest,
  AdminFeedbackUpdateRequest,
  FeedbackStatus,
} from "@/types/admin";

// ============================================================================
// CURRENT USER HOOK
// ============================================================================

/**
 * Fetch the current user's profile including admin status.
 * Used to conditionally show admin sections in settings.
 */
export function useCurrentUser() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const query = useQuery({
    queryKey: currentUserQueryKeys.all,
    queryFn: async () => {
      const token = await getToken();
      return adminApi.getCurrentUser(token);
    },
    enabled: isLoaded && !!isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    ...query,
    isAdmin: query.data?.is_admin ?? false,
  };
}

// ============================================================================
// ADMIN USER HOOKS
// ============================================================================

/**
 * Fetch paginated list of all users (admin only).
 */
export function useAdminUsers(skip: number = 0, limit: number = 50) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: [...adminQueryKeys.users(), { skip, limit }],
    queryFn: async () => {
      const token = await getToken();
      return adminApi.listUsers({ skip, limit }, token);
    },
    staleTime: 30000,
  });
}

/**
 * Grant pro access to a user.
 */
export function useGrantPro() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number;
      data: AdminGrantProRequest;
    }) => {
      const token = await getToken();
      return adminApi.grantPro(userId, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
    },
  });
}

/**
 * Revoke granted pro access from a user.
 */
export function useRevokePro() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const token = await getToken();
      return adminApi.revokePro(userId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
    },
  });
}

/**
 * Toggle admin flag on a user.
 */
export function useToggleAdmin() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number;
      data: AdminToggleAdminRequest;
    }) => {
      const token = await getToken();
      return adminApi.toggleAdmin(userId, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
    },
  });
}

/**
 * Delete a user and all their data.
 */
export function useDeleteUser() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const token = await getToken();
      return adminApi.deleteUser(userId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
    },
  });
}

// ============================================================================
// ADMIN FEEDBACK HOOKS
// ============================================================================

/**
 * Fetch paginated list of feedback with filters (admin only).
 */
export function useAdminFeedback(
  filters: {
    skip?: number;
    limit?: number;
    category?: string;
    status?: FeedbackStatus;
  } = {},
) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: [...adminQueryKeys.feedback(), filters],
    queryFn: async () => {
      const token = await getToken();
      return adminApi.listFeedback(filters, token);
    },
    staleTime: 30000,
  });
}

/**
 * Fetch a single feedback detail (admin only).
 */
export function useAdminFeedbackDetail(feedbackId: number | null) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: adminQueryKeys.feedbackDetail(feedbackId!),
    queryFn: async () => {
      const token = await getToken();
      return adminApi.getFeedback(feedbackId!, token);
    },
    enabled: feedbackId !== null,
    staleTime: 60000,
  });
}

/**
 * Update feedback status and/or admin notes.
 */
export function useUpdateFeedback() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      feedbackId,
      data,
    }: {
      feedbackId: number;
      data: AdminFeedbackUpdateRequest;
    }) => {
      const token = await getToken();
      return adminApi.updateFeedback(feedbackId, data, token);
    },
    onSuccess: (_, { feedbackId }) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.feedback() });
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.feedbackDetail(feedbackId),
      });
    },
  });
}
