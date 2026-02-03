"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  cookingTipApi,
  mealSuggestionsApi,
  imageGenerationApi,
  mealGenieApi,
} from "@/lib/api";
import { aiQueryKeys } from "./queryKeys";
import type {
  ImageGenerationType,
  MealSuggestionsRequestDTO,
  MealGenieMessage,
} from "@/types/ai";

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch a random cooking tip from AI.
 * Cached for the session - use refetch to get a new tip.
 */
export function useCookingTip() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: aiQueryKeys.cookingTip(),
    queryFn: async () => {
      const token = await getToken();
      return cookingTipApi.getTip(token);
    },
    staleTime: Infinity, // Never auto-refetch - user must manually refresh
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Get AI-powered meal suggestions (side dishes + cooking tip) for a meal.
 * Uses mutation because each call generates new suggestions.
 */
export function useMealSuggestions() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (request: MealSuggestionsRequestDTO) => {
      const token = await getToken();
      return mealSuggestionsApi.getSuggestions(request, token);
    },
  });
}

/**
 * Generate an AI image for a recipe.
 * Returns base64-encoded image data.
 */
export function useGenerateImage() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      recipeName,
      customPrompt,
      imageType,
    }: {
      recipeName: string;
      customPrompt?: string;
      imageType?: ImageGenerationType;
    }) => {
      const token = await getToken();
      return imageGenerationApi.generate(recipeName, customPrompt, token, imageType);
    },
  });
}

/**
 * Generate a banner image from a reference image.
 * Returns base64-encoded banner image data (21:9 aspect ratio).
 */
export function useGenerateBanner() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      recipeName,
      referenceImageData,
    }: {
      recipeName: string;
      referenceImageData: string;
    }) => {
      const token = await getToken();
      return imageGenerationApi.generateBanner(recipeName, referenceImageData, token);
    },
  });
}

/**
 * Send a message to Meal Genie AI assistant.
 * Supports conversation history for context.
 * May return chat response, recipe suggestions, or a generated recipe.
 */
export function useMealGenieChat() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      message,
      conversationHistory,
    }: {
      message: string;
      conversationHistory?: MealGenieMessage[];
    }) => {
      const token = await getToken();
      return mealGenieApi.chat(message, conversationHistory, token);
    },
  });
}

/**
 * Ask Meal Genie a question.
 * Alias for useMealGenieChat - uses the same endpoint.
 * Supports conversation history for context.
 */
export function useMealGenieAsk() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      message,
      conversationHistory,
    }: {
      message: string;
      conversationHistory?: MealGenieMessage[];
    }) => {
      const token = await getToken();
      return mealGenieApi.ask(message, conversationHistory, token);
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Manually refresh the cooking tip.
 * Call this when user requests a new tip.
 */
export function useRefreshCookingTip() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: aiQueryKeys.cookingTip() });
  };
}
